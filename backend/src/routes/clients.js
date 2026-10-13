const express = require("express");
const pool = require("../config/database");

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_STATUSES = new Set(["active", "inactive"]);

const CLIENT_FIELDS = [
    "company_name",
    "contact_name",
    "email",
    "phone",
    "address",
    "notes",
    "status",
    "profile_id"
];

// --------------------------------------------------
// ROLE-BASED ACCESS
// --------------------------------------------------

function getClientScope(profile, parameterIndex = 1) {
    switch (profile.role) {
        case "administrator":
        case "finance_manager":
            return {
                condition: "TRUE",
                values: []
            };

        case "developer":
            return {
                condition: `
                    EXISTS (
                        SELECT 1
                        FROM public.projects p
                        WHERE p.client_id = c.id
                          AND p.assigned_developer_id = $${parameterIndex}
                    )
                `,
                values: [profile.id]
            };

        case "client":
            return {
                condition: `c.profile_id = $${parameterIndex}`,
                values: [profile.id]
            };

        default:
            return {
                condition: "FALSE",
                values: []
            };
    }
}

function requireAdministrator(req, res, next) {
    if (req.profile?.role !== "administrator") {
        return res.status(403).json({
            success: false,
            message: "Administrator permission is required."
        });
    }

    next();
}

// --------------------------------------------------
// INPUT VALIDATION
// --------------------------------------------------

function validateClientPayload(body, partial = false) {
    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return {
            error: "The request body must be a JSON object."
        };
    }

    const unexpectedField = Object.keys(body).find(
        field => !CLIENT_FIELDS.includes(field)
    );

    if (unexpectedField) {
        return {
            error: `The field "${unexpectedField}" cannot be changed.`
        };
    }

    const data = {};

    const textRules = {
        company_name: {
            maxLength: 150,
            nullable: false
        },
        contact_name: {
            maxLength: 100,
            nullable: false
        },
        email: {
            maxLength: 254,
            nullable: true
        },
        phone: {
            maxLength: 50,
            nullable: true
        },
        address: {
            maxLength: 500,
            nullable: true
        },
        notes: {
            maxLength: 2000,
            nullable: true
        }
    };

    for (const [field, rule] of Object.entries(textRules)) {
        const provided = Object.prototype.hasOwnProperty.call(
            body,
            field
        );

        if (partial && !provided) {
            continue;
        }

        let value = provided ? body[field] : undefined;

        if (
            !partial &&
            value === undefined &&
            rule.nullable
        ) {
            data[field] = null;
            continue;
        }

        if (value === null && rule.nullable) {
            data[field] = null;
            continue;
        }

        if (typeof value !== "string") {
            return {
                error: `${field} must be a valid text value.`
            };
        }

        value = value.trim();

        if (rule.nullable && value === "") {
            data[field] = null;
            continue;
        }

        if (!rule.nullable && value.length < 2) {
            return {
                error: `${field} must contain at least 2 characters.`
            };
        }

        if (value.length > rule.maxLength) {
            return {
                error: `${field} cannot exceed ${rule.maxLength} characters.`
            };
        }

        if (
            field === "email" &&
            !EMAIL_REGEX.test(value)
        ) {
            return {
                error: "Enter a valid email address."
            };
        }

        data[field] =
            field === "email"
                ? value.toLowerCase()
                : value;
    }

    // Validate status.
    if (
        !partial ||
        Object.prototype.hasOwnProperty.call(body, "status")
    ) {
        const rawStatus =
            !partial && body.status === undefined
                ? "active"
                : body.status;

        if (typeof rawStatus !== "string") {
            return {
                error: "Status must be active or inactive."
            };
        }

        const status = rawStatus.trim().toLowerCase();

        if (!VALID_STATUSES.has(status)) {
            return {
                error: "Status must be active or inactive."
            };
        }

        data.status = status;
    }

    // Validate the linked client profile.
    if (
        !partial ||
        Object.prototype.hasOwnProperty.call(body, "profile_id")
    ) {
        let profileId =
            !partial && body.profile_id === undefined
                ? null
                : body.profile_id;

        if (typeof profileId === "string") {
            profileId = profileId.trim() || null;
        }

        if (
            profileId !== null &&
            (
                typeof profileId !== "string" ||
                !UUID_REGEX.test(profileId)
            )
        ) {
            return {
                error: "Profile ID must be a valid UUID or null."
            };
        }

        data.profile_id = profileId;
    }

    if (partial && Object.keys(data).length === 0) {
        return {
            error: "Provide at least one valid field to update."
        };
    }

    return { data };
}

// --------------------------------------------------
// PROFILE LINK VALIDATION
// --------------------------------------------------

async function isActiveClientProfile(profileId) {
    const result = await pool.query(
        `SELECT id
         FROM public.profiles
         WHERE id = $1
           AND role = 'client'
           AND is_active = TRUE
         LIMIT 1`,
        [profileId]
    );

    return result.rowCount > 0;
}

// --------------------------------------------------
// DATABASE ERROR HANDLING
// --------------------------------------------------

function handleDatabaseError(error, res, context) {
    console.error(`${context}:`, error.message);

    if (error.code === "23505") {
        return res.status(409).json({
            success: false,
            message:
                "This client profile is already linked to another client."
        });
    }

    if (error.code === "23503") {
        return res.status(400).json({
            success: false,
            message:
                "The selected profile does not exist or cannot be linked."
        });
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected database error occurred."
    });
}

// --------------------------------------------------
// CLIENT ROUTES
// --------------------------------------------------

module.exports = function createClientsRouter(requireAuth) {
    const router = express.Router();

    // Every client endpoint requires authentication.
    router.use(requireAuth);

    // GET /api/v1/clients
    // List clients accessible to the authenticated user.
    router.get("/", async (req, res) => {
        try {
            const scope = getClientScope(req.profile);

            const result = await pool.query(
                `SELECT c.*
                 FROM public.clients c
                 WHERE ${scope.condition}
                 ORDER BY c.company_name ASC`,
                scope.values
            );

            return res.json({
                success: true,
                count: result.rowCount,
                clients: result.rows
            });
        } catch (error) {
            return handleDatabaseError(
                error,
                res,
                "List clients failed"
            );
        }
    });

    // GET /api/v1/clients/:id
    // Retrieve one client, subject to access restrictions.
    router.get("/:id", async (req, res) => {
        const clientId = req.params.id;

        if (!UUID_REGEX.test(clientId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid client ID."
            });
        }

        try {
            const scope = getClientScope(req.profile, 2);

            const result = await pool.query(
                `SELECT c.*
                 FROM public.clients c
                 WHERE c.id = $1
                   AND (${scope.condition})
                 LIMIT 1`,
                [clientId, ...scope.values]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Client not found."
                });
            }

            return res.json({
                success: true,
                client: result.rows[0]
            });
        } catch (error) {
            return handleDatabaseError(
                error,
                res,
                "Get client failed"
            );
        }
    });

    // POST /api/v1/clients
    // Only administrators may create clients.
    router.post(
        "/",
        requireAdministrator,
        async (req, res) => {
            const validation = validateClientPayload(req.body);

            if (validation.error) {
                return res.status(400).json({
                    success: false,
                    message: validation.error
                });
            }

            const data = validation.data;

            try {
                if (
                    data.profile_id &&
                    !(await isActiveClientProfile(data.profile_id))
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "The linked profile must belong to an active client account."
                    });
                }

                const result = await pool.query(
                    `INSERT INTO public.clients (
                        company_name,
                        contact_name,
                        email,
                        phone,
                        address,
                        notes,
                        status,
                        profile_id,
                        created_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *`,
                    [
                        data.company_name,
                        data.contact_name,
                        data.email,
                        data.phone,
                        data.address,
                        data.notes,
                        data.status,
                        data.profile_id,
                        req.profile.id
                    ]
                );

                return res.status(201).json({
                    success: true,
                    message: "Client created successfully.",
                    client: result.rows[0]
                });
            } catch (error) {
                return handleDatabaseError(
                    error,
                    res,
                    "Create client failed"
                );
            }
        }
    );

    // PATCH /api/v1/clients/:id
    // Only administrators may update client records.
    router.patch(
        "/:id",
        requireAdministrator,
        async (req, res) => {
            const clientId = req.params.id;

            if (!UUID_REGEX.test(clientId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid client ID."
                });
            }

            const validation = validateClientPayload(
                req.body,
                true
            );

            if (validation.error) {
                return res.status(400).json({
                    success: false,
                    message: validation.error
                });
            }

            const data = validation.data;

            try {
                if (
                    data.profile_id &&
                    !(await isActiveClientProfile(data.profile_id))
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "The linked profile must belong to an active client account."
                    });
                }

                const fields = Object.keys(data);

                const values = fields.map(
                    field => data[field]
                );

                const assignments = fields.map(
                    (field, index) =>
                        `${field} = $${index + 1}`
                );

                values.push(clientId);

                const result = await pool.query(
                    `UPDATE public.clients
                     SET ${assignments.join(", ")},
                         updated_at = pg_catalog.now()
                     WHERE id = $${values.length}
                     RETURNING *`,
                    values
                );

                if (result.rowCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Client not found."
                    });
                }

                return res.json({
                    success: true,
                    message: "Client updated successfully.",
                    client: result.rows[0]
                });
            } catch (error) {
                return handleDatabaseError(
                    error,
                    res,
                    "Update client failed"
                );
            }
        }
    );

    // DELETE /api/v1/clients/:id
    // Deactivate rather than physically delete, preserving project
    // and financial history.
    router.delete(
        "/:id",
        requireAdministrator,
        async (req, res) => {
            const clientId = req.params.id;

            if (!UUID_REGEX.test(clientId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid client ID."
                });
            }

            try {
                const result = await pool.query(
                    `UPDATE public.clients
                     SET status = 'inactive',
                         updated_at = pg_catalog.now()
                     WHERE id = $1
                     RETURNING *`,
                    [clientId]
                );

                if (result.rowCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Client not found."
                    });
                }

                return res.json({
                    success: true,
                    message: "Client deactivated successfully.",
                    client: result.rows[0]
                });
            } catch (error) {
                return handleDatabaseError(
                    error,
                    res,
                    "Deactivate client failed"
                );
            }
        }
    );

    return router;
};
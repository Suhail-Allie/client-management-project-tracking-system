const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROJECT_STATUSES = new Set([
    "planned",
    "in_progress",
    "on_hold",
    "completed",
    "cancelled"
]);

const DEVELOPER_STATUSES = new Set([
    "planned",
    "in_progress",
    "on_hold",
    "completed"
]);

const PROJECT_PRIORITIES = new Set([
    "low",
    "medium",
    "high",
    "urgent"
]);

const ALLOWED_FIELDS = new Set([
    "client_id",
    "project_code",
    "name",
    "description",
    "status",
    "priority",
    "start_date",
    "due_date",
    "budget",
    "assigned_developer_id"
]);

const PROJECT_SELECT = `
    SELECT
        p.*,
        c.company_name,
        c.contact_name,
        d.display_name AS assigned_developer_name
    FROM public.projects p
    INNER JOIN public.clients c
        ON c.id = p.client_id
    LEFT JOIN public.profiles d
        ON d.id = p.assigned_developer_id
`;


// --------------------------------------------------
// ROLE-BASED PROJECT VISIBILITY
// --------------------------------------------------

function getProjectScope(profile, placeholder = "$1") {
    switch (profile.role) {
        case "administrator":
        case "finance_manager":
            return {
                condition: "TRUE",
                values: []
            };

        case "developer":
            return {
                condition: `p.assigned_developer_id = ${placeholder}`,
                values: [profile.id]
            };

        case "client":
            return {
                condition: `c.profile_id = ${placeholder}`,
                values: [profile.id]
            };

        default:
            return {
                condition: "FALSE",
                values: []
            };
    }
}


// --------------------------------------------------
// AUTHORISATION
// --------------------------------------------------

function requireAdministrator(req, res, next) {
    if (req.profile.role !== "administrator") {
        return res.status(403).json({
            success: false,
            message: "Only administrators can perform this action."
        });
    }

    next();
}


// --------------------------------------------------
// INPUT VALIDATION
// --------------------------------------------------

function isValidDate(value) {
    if (typeof value !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    try {
        return (
            new Date(`${value}T00:00:00.000Z`)
                .toISOString()
                .slice(0, 10) === value
        );
    } catch {
        return false;
    }
}


function validateProjectPayload(body, partial = false) {
    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return {
            error: "A valid JSON object is required."
        };
    }

    const keys = Object.keys(body);

    const unknownFields = keys.filter(
        (key) => !ALLOWED_FIELDS.has(key)
    );

    if (unknownFields.length > 0) {
        return {
            error: `Unsupported field: ${unknownFields[0]}.`
        };
    }

    if (partial && keys.length === 0) {
        return {
            error: "Provide at least one field to update."
        };
    }

    const data = {};

    for (const key of keys) {
        const value = body[key];

        switch (key) {
            case "client_id":
                if (
                    typeof value !== "string" ||
                    !UUID_REGEX.test(value)
                ) {
                    return {
                        error: "A valid client ID is required."
                    };
                }

                data.client_id = value;
                break;

            case "project_code":
                if (
                    typeof value !== "string" ||
                    value.trim().length === 0 ||
                    value.trim().length > 50
                ) {
                    return {
                        error: "Project code must contain between 1 and 50 characters."
                    };
                }

                data.project_code = value.trim();
                break;

            case "name":
                if (
                    typeof value !== "string" ||
                    value.trim().length === 0 ||
                    value.trim().length > 150
                ) {
                    return {
                        error: "Project name must contain between 1 and 150 characters."
                    };
                }

                data.name = value.trim();
                break;

            case "description":
                if (
                    value !== null &&
                    (
                        typeof value !== "string" ||
                        value.length > 5000
                    )
                ) {
                    return {
                        error: "Description must be text of no more than 5000 characters, or null."
                    };
                }

                data.description =
                    typeof value === "string"
                        ? value.trim() || null
                        : null;
                break;

            case "status":
                if (!PROJECT_STATUSES.has(value)) {
                    return {
                        error: "Invalid project status."
                    };
                }

                data.status = value;
                break;

            case "priority":
                if (!PROJECT_PRIORITIES.has(value)) {
                    return {
                        error: "Invalid project priority."
                    };
                }

                data.priority = value;
                break;

            case "start_date":
            case "due_date":
                if (
                    value !== null &&
                    !isValidDate(value)
                ) {
                    return {
                        error: `${key} must be a valid YYYY-MM-DD date or null.`
                    };
                }

                data[key] = value;
                break;

            case "budget":
                if (
                    typeof value !== "number" ||
                    !Number.isFinite(value) ||
                    value < 0 ||
                    value > 9999999999.99
                ) {
                    return {
                        error: "Budget must be a valid non-negative number."
                    };
                }

                data.budget = value;
                break;

            case "assigned_developer_id":
                if (
                    value !== null &&
                    (
                        typeof value !== "string" ||
                        !UUID_REGEX.test(value)
                    )
                ) {
                    return {
                        error: "Assigned developer ID must be a valid UUID or null."
                    };
                }

                data.assigned_developer_id = value;
                break;
        }
    }

    if (!partial) {
        if (!("client_id" in data)) {
            return {
                error: "Client ID is required."
            };
        }

        if (!("project_code" in data)) {
            return {
                error: "Project code is required."
            };
        }

        if (!("name" in data)) {
            return {
                error: "Project name is required."
            };
        }

        const defaults = {
            description: null,
            status: "planned",
            priority: "medium",
            start_date: null,
            due_date: null,
            budget: 0,
            assigned_developer_id: null
        };

        for (const [key, value] of Object.entries(defaults)) {
            if (!(key in data)) {
                data[key] = value;
            }
        }
    }

    return {
        data
    };
}


// --------------------------------------------------
// DATABASE VALIDATION
// --------------------------------------------------

async function clientExists(clientId) {
    const result = await pool.query(
        `SELECT id
         FROM public.clients
         WHERE id = $1
         LIMIT 1`,
        [clientId]
    );

    return result.rows.length > 0;
}


async function developerExists(developerId) {
    if (developerId === null) {
        return true;
    }

    const result = await pool.query(
        `SELECT id
         FROM public.profiles
         WHERE id = $1
           AND role = 'developer'
           AND is_active = true
         LIMIT 1`,
        [developerId]
    );

    return result.rows.length > 0;
}


// --------------------------------------------------
// DATABASE ERROR HANDLING
// --------------------------------------------------

function handleDatabaseError(res, error, operation) {
    if (error.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "A project with this project code already exists."
        });
    }

    if (error.code === "23503") {
        return res.status(400).json({
            success: false,
            message: "A referenced client or developer does not exist."
        });
    }

    if (error.code === "23514") {
        return res.status(400).json({
            success: false,
            message: "The project data violates a database constraint. Check the dates and field values."
        });
    }

    console.error(`${operation}:`, error.message);

    return res.status(500).json({
        success: false,
        message: "Unable to process the project request."
    });
}


// --------------------------------------------------
// GET ALL PROJECTS
// GET /api/v1/projects
// --------------------------------------------------

router.get("/", async (req, res) => {
    try {
        const scope = getProjectScope(req.profile);

        const result = await pool.query(
            `${PROJECT_SELECT}
             WHERE ${scope.condition}
             ORDER BY p.created_at DESC`,
            scope.values
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            projects: result.rows
        });
    } catch (error) {
        return handleDatabaseError(
            res,
            error,
            "Get projects error"
        );
    }
});


// --------------------------------------------------
// GET ONE PROJECT
// GET /api/v1/projects/:id
// --------------------------------------------------

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project ID."
        });
    }

    try {
        const scope = getProjectScope(
            req.profile,
            "$2"
        );

        const result = await pool.query(
            `${PROJECT_SELECT}
             WHERE p.id = $1
               AND (${scope.condition})
             LIMIT 1`,
            [id, ...scope.values]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found or you do not have access to it."
            });
        }

        return res.status(200).json({
            success: true,
            project: result.rows[0]
        });
    } catch (error) {
        return handleDatabaseError(
            res,
            error,
            "Get project error"
        );
    }
});


// --------------------------------------------------
// CREATE PROJECT
// POST /api/v1/projects
// Administrator only
// --------------------------------------------------

router.post(
    "/",
    requireAdministrator,
    async (req, res) => {
        const validation = validateProjectPayload(
            req.body,
            false
        );

        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        const data = validation.data;

        try {
            const clientFound = await clientExists(
                data.client_id
            );

            if (!clientFound) {
                return res.status(400).json({
                    success: false,
                    message: "The selected client does not exist."
                });
            }

            const developerFound = await developerExists(
                data.assigned_developer_id
            );

            if (!developerFound) {
                return res.status(400).json({
                    success: false,
                    message: "The selected developer does not exist or is inactive."
                });
            }

            const result = await pool.query(
                `INSERT INTO public.projects (
                    client_id,
                    project_code,
                    name,
                    description,
                    status,
                    priority,
                    start_date,
                    due_date,
                    budget,
                    assigned_developer_id,
                    created_by
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10, $11
                )
                RETURNING *`,
                [
                    data.client_id,
                    data.project_code,
                    data.name,
                    data.description,
                    data.status,
                    data.priority,
                    data.start_date,
                    data.due_date,
                    data.budget,
                    data.assigned_developer_id,
                    req.profile.id
                ]
            );

            return res.status(201).json({
                success: true,
                message: "Project created successfully.",
                project: result.rows[0]
            });
        } catch (error) {
            return handleDatabaseError(
                res,
                error,
                "Create project error"
            );
        }
    }
);


// --------------------------------------------------
// UPDATE PROJECT
// PATCH /api/v1/projects/:id
//
// Administrators can update project fields.
// Developers can update the status of assigned projects.
// --------------------------------------------------

router.patch("/:id", async (req, res) => {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project ID."
        });
    }

    const role = req.profile.role;

    // Developers may update only the status of their
    // assigned projects.
    if (role === "developer") {
        const body = req.body;

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body) ||
            Object.keys(body).length !== 1 ||
            !Object.prototype.hasOwnProperty.call(body, "status")
        ) {
            return res.status(403).json({
                success: false,
                message: "Developers may only update the status of their assigned projects."
            });
        }

        if (!DEVELOPER_STATUSES.has(body.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status for a developer."
            });
        }

        try {
            const result = await pool.query(
                `UPDATE public.projects
                 SET status = $1
                 WHERE id = $2
                   AND assigned_developer_id = $3
                 RETURNING *`,
                [
                    body.status,
                    id,
                    req.profile.id
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned project not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Project progress updated successfully.",
                project: result.rows[0]
            });
        } catch (error) {
            return handleDatabaseError(
                res,
                error,
                "Developer project update error"
            );
        }
    }

    // All other non-administrator roles are read-only.
    if (role !== "administrator") {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to update projects."
        });
    }

    const validation = validateProjectPayload(
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
    const fields = Object.keys(data);

    try {
        if ("client_id" in data) {
            const clientFound = await clientExists(
                data.client_id
            );

            if (!clientFound) {
                return res.status(400).json({
                    success: false,
                    message: "The selected client does not exist."
                });
            }
        }

        if ("assigned_developer_id" in data) {
            const developerFound = await developerExists(
                data.assigned_developer_id
            );

            if (!developerFound) {
                return res.status(400).json({
                    success: false,
                    message: "The selected developer does not exist or is inactive."
                });
            }
        }

        const values = fields.map(
            (field) => data[field]
        );

        const assignments = fields.map(
            (field, index) => `${field} = $${index + 1}`
        );

        assignments.push("updated_at = NOW()");

        values.push(id);

        const result = await pool.query(
            `UPDATE public.projects
             SET ${assignments.join(", ")}
             WHERE id = $${values.length}
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project updated successfully.",
            project: result.rows[0]
        });
    } catch (error) {
        return handleDatabaseError(
            res,
            error,
            "Update project error"
        );
    }
});


// --------------------------------------------------
// CANCEL PROJECT
// DELETE /api/v1/projects/:id
// Administrator only
//
// Projects are cancelled instead of physically deleted,
// preserving their history and related records.
// --------------------------------------------------

router.delete(
    "/:id",
    requireAdministrator,
    async (req, res) => {
        const { id } = req.params;

        if (!UUID_REGEX.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID."
            });
        }

        try {
            const result = await pool.query(
                `UPDATE public.projects
                 SET status = 'cancelled'
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Project cancelled successfully.",
                project: result.rows[0]
            });
        } catch (error) {
            return handleDatabaseError(
                res,
                error,
                "Cancel project error"
            );
        }
    }
);


module.exports = function createProjectsRouter(requireAuth) {
    router.use(requireAuth);

    return router;
};
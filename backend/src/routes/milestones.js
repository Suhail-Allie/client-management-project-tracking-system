const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = [
    "pending",
    "in_progress",
    "completed",
    "blocked"
];

const MILESTONE_SELECT = `
    SELECT
        m.id,
        m.project_id,
        m.title,
        m.description,
        m.due_date,
        m.status,
        m.assigned_to,
        m.completed_at,
        m.created_at,
        m.updated_at,
        p.project_code,
        p.name AS project_name,
        c.id AS client_id,
        c.company_name,
        ap.display_name AS assigned_to_name
    FROM milestones m
    JOIN projects p
        ON p.id = m.project_id
    JOIN clients c
        ON c.id = p.client_id
    LEFT JOIN profiles ap
        ON ap.id = m.assigned_to
`;

function getMilestoneScope(profile, placeholder = "$1") {
    switch (profile.role) {
        case "administrator":
        case "finance_manager":
            return {
                clause: "1 = 1",
                params: []
            };

        case "developer":
            return {
                clause: `p.assigned_developer_id = ${placeholder}`,
                params: [profile.id]
            };

        case "client":
            return {
                clause: `c.profile_id = ${placeholder}`,
                params: [profile.id]
            };

        default:
            return {
                clause: "1 = 0",
                params: []
            };
    }
}

function requireMilestoneManager(req, res, next) {
    if (
        req.profile.role !== "administrator" &&
        req.profile.role !== "developer"
    ) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to manage milestones."
        });
    }

    next();
}

function validatePayload(body, partial = false) {
    const errors = [];

    if (!partial || body.title !== undefined) {
        if (
            typeof body.title !== "string" ||
            body.title.trim().length < 2 ||
            body.title.trim().length > 150
        ) {
            errors.push("Title must contain 2 to 150 characters.");
        }
    }

    if (body.description !== undefined && body.description !== null) {
        if (
            typeof body.description !== "string" ||
            body.description.length > 2000
        ) {
            errors.push("Description must not exceed 2000 characters.");
        }
    }

    if (body.due_date !== undefined && body.due_date !== null) {
        if (
            typeof body.due_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)
        ) {
            errors.push("Due date must use YYYY-MM-DD format.");
        }
    }

    if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) {
            errors.push(
                `Status must be one of: ${STATUSES.join(", ")}.`
            );
        }
    }

    if (body.assigned_to !== undefined && body.assigned_to !== null) {
        if (
            typeof body.assigned_to !== "string" ||
            !UUID_PATTERN.test(body.assigned_to)
        ) {
            errors.push("Assigned user ID must be a valid UUID.");
        }
    }

    return errors;
}

async function projectExists(projectId) {
    const result = await pool.query(
        "SELECT id, assigned_developer_id FROM projects WHERE id = $1 LIMIT 1",
        [projectId]
    );

    return result.rows[0] || null;
}

async function developerExists(userId) {
    const result = await pool.query(
        `SELECT id
         FROM profiles
         WHERE id = $1
           AND role = 'developer'
           AND is_active = true
         LIMIT 1`,
        [userId]
    );

    return Boolean(result.rows[0]);
}

async function getMilestoneById(id, profile) {
    const scope = getMilestoneScope(profile, "$2");

    const result = await pool.query(
        `${MILESTONE_SELECT}
         WHERE m.id = $1
           AND ${scope.clause}
         LIMIT 1`,
        [id, ...scope.params]
    );

    return result.rows[0] || null;
}

/* GET /api/v1/milestones */
router.get("/", async (req, res) => {
    try {
        const scope = getMilestoneScope(req.profile);

        const result = await pool.query(
            `${MILESTONE_SELECT}
             WHERE ${scope.clause}
             ORDER BY
                CASE
                    WHEN m.status = 'completed' THEN 2
                    ELSE 1
                END,
                m.due_date ASC NULLS LAST,
                m.created_at DESC`,
            scope.params
        );

        return res.json({
            success: true,
            count: result.rows.length,
            milestones: result.rows
        });
    } catch (error) {
        console.error("Get milestones error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process the milestone request."
        });
    }
});

/* GET /api/v1/milestones/:id */
router.get("/:id", async (req, res) => {
    try {
        if (!UUID_PATTERN.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid milestone ID."
            });
        }

        const milestone = await getMilestoneById(
            req.params.id,
            req.profile
        );

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: "Milestone not found."
            });
        }

        return res.json({
            success: true,
            milestone
        });
    } catch (error) {
        console.error("Get milestone error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the milestone."
        });
    }
});

/* POST /api/v1/milestones */
router.post("/", requireMilestoneManager, async (req, res) => {
    try {
        const body = req.body || {};

        const errors = validatePayload(body);

        if (
            typeof body.project_id !== "string" ||
            !UUID_PATTERN.test(body.project_id)
        ) {
            errors.push("Project ID must be a valid UUID.");
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid milestone data.",
                errors
            });
        }

        const project = await projectExists(body.project_id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        if (
            req.profile.role === "developer" &&
            project.assigned_developer_id !== req.profile.id
        ) {
            return res.status(403).json({
                success: false,
                message: "You may only manage milestones for assigned projects."
            });
        }

        const assignedTo =
            body.assigned_to === undefined
                ? req.profile.role === "developer"
                    ? req.profile.id
                    : null
                : body.assigned_to;

        if (assignedTo && !(await developerExists(assignedTo))) {
            return res.status(400).json({
                success: false,
                message: "Assigned user must be an active developer."
            });
        }

        const result = await pool.query(
            `INSERT INTO milestones
                (
                    project_id,
                    title,
                    description,
                    due_date,
                    status,
                    assigned_to
                )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [
                body.project_id,
                body.title.trim(),
                body.description?.trim() || null,
                body.due_date || null,
                body.status || "pending",
                assignedTo
            ]
        );

        const milestone = await getMilestoneById(
            result.rows[0].id,
            req.profile.role === "developer"
                ? req.profile
                : {
                    ...req.profile,
                    role: "administrator"
                }
        );

        return res.status(201).json({
            success: true,
            message: "Milestone created successfully.",
            milestone
        });
    } catch (error) {
        console.error("Create milestone error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create the milestone."
        });
    }
});

/* PATCH /api/v1/milestones/:id */
router.patch(
    "/:id",
    requireMilestoneManager,
    async (req, res) => {
        try {
            if (!UUID_PATTERN.test(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid milestone ID."
                });
            }

            const existing = await getMilestoneById(
                req.params.id,
                req.profile
            );

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Milestone not found."
                });
            }

            const errors = validatePayload(req.body || {}, true);

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid milestone data.",
                    errors
                });
            }

            const body = req.body || {};
            const updates = [];
            const values = [];
            let index = 1;

            const allowedFields = [
                "title",
                "description",
                "due_date",
                "status",
                "assigned_to"
            ];

            for (const field of allowedFields) {
                if (body[field] !== undefined) {
                    let value = body[field];

                    if (field === "title") {
                        value = value.trim();
                    }

                    if (field === "description" && value !== null) {
                        value = value.trim();
                    }

                    updates.push(`${field} = $${index++}`);
                    values.push(value);
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No milestone changes were supplied."
                });
            }

            if (body.assigned_to !== undefined) {
                if (
                    body.assigned_to !== null &&
                    !(await developerExists(body.assigned_to))
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Assigned user must be an active developer."
                    });
                }
            }

            if (body.status === "completed") {
                updates.push("completed_at = NOW()");
            } else if (body.status !== undefined) {
                updates.push("completed_at = NULL");
            }

            updates.push("updated_at = NOW()");

            values.push(req.params.id);

            await pool.query(
                `UPDATE milestones
                 SET ${updates.join(", ")}
                 WHERE id = $${index}`,
                values
            );

            const milestone = await getMilestoneById(
                req.params.id,
                req.profile
            );

            return res.json({
                success: true,
                message: "Milestone updated successfully.",
                milestone
            });
        } catch (error) {
            console.error("Update milestone error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Unable to update the milestone."
            });
        }
    }
);

/* DELETE /api/v1/milestones/:id */
router.delete(
    "/:id",
    requireMilestoneManager,
    async (req, res) => {
        try {
            if (!UUID_PATTERN.test(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid milestone ID."
                });
            }

            const existing = await getMilestoneById(
                req.params.id,
                req.profile
            );

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Milestone not found."
                });
            }

            await pool.query(
                "DELETE FROM milestones WHERE id = $1",
                [req.params.id]
            );

            return res.json({
                success: true,
                message: "Milestone deleted successfully."
            });
        } catch (error) {
            console.error("Delete milestone error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Unable to delete the milestone."
            });
        }
    }
);

module.exports = function createMilestonesRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};
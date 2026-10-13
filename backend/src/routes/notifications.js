const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

function requireAdministrator(req, res, next) {
    if (req.profile.role !== "administrator") {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to manage notifications."
        });
    }

    next();
}

function getNotificationScope(profile, placeholder = "$1") {
    if (profile.role === "administrator") {
        return {
            clause: "1=1",
            params: []
        };
    }

    return {
        clause: `n.user_id = ${placeholder}`,
        params: [profile.id]
    };
}

function validateNotification(body, partial = false) {
    const errors = [];

    if (!partial || body.user_id !== undefined) {
        if (!isUuid(body.user_id)) {
            errors.push("A valid user_id is required.");
        }
    }

    if (!partial || body.title !== undefined) {
        if (
            typeof body.title !== "string" ||
            body.title.trim().length === 0
        ) {
            errors.push("title is required.");
        } else if (body.title.trim().length > 200) {
            errors.push("title must not exceed 200 characters.");
        }
    }

    if (!partial || body.message !== undefined) {
        if (
            typeof body.message !== "string" ||
            body.message.trim().length === 0
        ) {
            errors.push("message is required.");
        } else if (body.message.length > 5000) {
            errors.push("message must not exceed 5000 characters.");
        }
    }

    if (!partial || body.type !== undefined) {
        if (
            typeof body.type !== "string" ||
            body.type.trim().length === 0
        ) {
            errors.push("type is required.");
        } else if (body.type.trim().length > 50) {
            errors.push("type must not exceed 50 characters.");
        }
    }

    if (body.is_read !== undefined && typeof body.is_read !== "boolean") {
        errors.push("is_read must be a boolean.");
    }

    if (
        body.related_project_id !== undefined &&
        body.related_project_id !== null &&
        !isUuid(body.related_project_id)
    ) {
        errors.push("related_project_id must be a valid UUID or null.");
    }

    return errors;
}

async function getNotificationById(id, profile) {
    const scope = getNotificationScope(profile, "$2");

    const result = await pool.query(
        `
        SELECT
            n.id,
            n.user_id,
            n.title,
            n.message,
            n.type,
            n.is_read,
            n.related_project_id,
            n.created_at,
            u.display_name AS user_name,
            u.email AS user_email,
            p.name AS project_name
        FROM public.notifications n
        INNER JOIN public.profiles u
            ON u.id = n.user_id
        LEFT JOIN public.projects p
            ON p.id = n.related_project_id
        WHERE n.id = $1
          AND ${scope.clause}
        LIMIT 1
        `,
        [id, ...scope.params]
    );

    return result.rows[0] || null;
}

// GET ALL
router.get("/", async (req, res) => {
    try {
        const scope = getNotificationScope(req.profile);

        const result = await pool.query(
            `
            SELECT
                n.id,
                n.user_id,
                n.title,
                n.message,
                n.type,
                n.is_read,
                n.related_project_id,
                n.created_at,
                u.display_name AS user_name,
                u.email AS user_email,
                p.name AS project_name
            FROM public.notifications n
            INNER JOIN public.profiles u
                ON u.id = n.user_id
            LEFT JOIN public.projects p
                ON p.id = n.related_project_id
            WHERE ${scope.clause}
            ORDER BY n.is_read ASC, n.created_at DESC
            `,
            scope.params
        );

        return res.json({
            success: true,
            count: result.rows.length,
            notifications: result.rows
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve notifications."
        });
    }
});

// GET ONE
router.get("/:id", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        const notification = await getNotificationById(
            req.params.id,
            req.profile
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error("Get notification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the notification."
        });
    }
});

// CREATE
router.post("/", requireAdministrator, async (req, res) => {
    try {
        const errors = validateNotification(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification data.",
                errors
            });
        }

        const {
            user_id,
            title,
            message,
            type,
            is_read = false,
            related_project_id = null
        } = req.body;

        const user = await pool.query(
            `
            SELECT id
            FROM public.profiles
            WHERE id = $1
              AND is_active = true
            LIMIT 1
            `,
            [user_id]
        );

        if (!user.rows[0]) {
            return res.status(404).json({
                success: false,
                message: "Active user profile not found."
            });
        }

        if (related_project_id) {
            const project = await pool.query(
                `
                SELECT id
                FROM public.projects
                WHERE id = $1
                LIMIT 1
                `,
                [related_project_id]
            );

            if (!project.rows[0]) {
                return res.status(404).json({
                    success: false,
                    message: "Related project not found."
                });
            }
        }

        const result = await pool.query(
            `
            INSERT INTO public.notifications
                (
                    user_id,
                    title,
                    message,
                    type,
                    is_read,
                    related_project_id
                )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING id
            `,
            [
                user_id,
                title.trim(),
                message.trim(),
                type.trim(),
                is_read,
                related_project_id
            ]
        );

        const notification = await getNotificationById(
            result.rows[0].id,
            req.profile
        );

        return res.status(201).json({
            success: true,
            message: "Notification created successfully.",
            notification
        });
    } catch (error) {
        console.error("Create notification error:", error.message);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Invalid related record supplied."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create the notification."
        });
    }
});

// UPDATE
router.patch("/:id", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        const existing = await getNotificationById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        const errors = validateNotification(req.body, true);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification data.",
                errors
            });
        }

        const allowedForUser = [
            "is_read"
        ];

        const allowedForAdministrator = [
            "user_id",
            "title",
            "message",
            "type",
            "is_read",
            "related_project_id"
        ];

        const allowed =
            req.profile.role === "administrator"
                ? allowedForAdministrator
                : allowedForUser;

        const updates = [];
        const values = [];

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${values.length + 1}`);

                values.push(
                    typeof req.body[field] === "string"
                        ? req.body[field].trim()
                        : req.body[field]
                );
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were supplied for update."
            });
        }

        values.push(req.params.id);

        await pool.query(
            `
            UPDATE public.notifications
            SET ${updates.join(", ")}
            WHERE id = $${values.length}
            `,
            values
        );

        const notification = await getNotificationById(
            req.params.id,
            req.profile
        );

        return res.json({
            success: true,
            message: "Notification updated successfully.",
            notification
        });
    } catch (error) {
        console.error("Update notification error:", error.message);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Invalid related record supplied."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update the notification."
        });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        const existing = await getNotificationById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        await pool.query(
            `
            DELETE FROM public.notifications
            WHERE id = $1
            `,
            [req.params.id]
        );

        return res.json({
            success: true,
            message: "Notification deleted successfully."
        });
    } catch (error) {
        console.error("Delete notification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the notification."
        });
    }
});

module.exports = function createNotificationsRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};
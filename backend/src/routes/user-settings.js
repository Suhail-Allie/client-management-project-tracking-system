const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const THEMES = new Set([
    "light",
    "dark",
    "system"
]);

const LANGUAGES = new Set([
    "en"
]);

function validateSettings(body, partial = false) {
    const errors = [];

    if (!partial || body.theme !== undefined) {
        if (!THEMES.has(body.theme)) {
            errors.push("Invalid theme. Use light, dark, or system.");
        }
    }

    if (
        body.notifications_enabled !== undefined &&
        typeof body.notifications_enabled !== "boolean"
    ) {
        errors.push("notifications_enabled must be a boolean.");
    }

    if (
        body.email_notifications !== undefined &&
        typeof body.email_notifications !== "boolean"
    ) {
        errors.push("email_notifications must be a boolean.");
    }

    if (!partial || body.language !== undefined) {
        if (!LANGUAGES.has(body.language)) {
            errors.push("Invalid language.");
        }
    }

    if (
        body.compact_mode !== undefined &&
        typeof body.compact_mode !== "boolean"
    ) {
        errors.push("compact_mode must be a boolean.");
    }

    return errors;
}

async function getSettings(userId) {
    const result = await pool.query(
        `
        SELECT
            user_id,
            theme,
            notifications_enabled,
            email_notifications,
            language,
            compact_mode
        FROM public.user_settings
        WHERE user_id = $1
        LIMIT 1
        `,
        [userId]
    );

    return result.rows[0] || null;
}

// GET CURRENT USER SETTINGS
router.get("/", async (req, res) => {
    try {
        const settings = await getSettings(req.profile.id);

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "User settings not found."
            });
        }

        return res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error("Get user settings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user settings."
        });
    }
});

// UPDATE CURRENT USER SETTINGS
router.patch("/", async (req, res) => {
    try {
        const errors = validateSettings(req.body, true);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid settings data.",
                errors
            });
        }

        const allowed = [
            "theme",
            "notifications_enabled",
            "email_notifications",
            "language",
            "compact_mode"
        ];

        const updates = [];
        const values = [];

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${values.length + 1}`);
                values.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid settings were supplied for update."
            });
        }

        values.push(req.profile.id);

        const result = await pool.query(
            `
            UPDATE public.user_settings
            SET ${updates.join(", ")}
            WHERE user_id = $${values.length}
            RETURNING
                user_id,
                theme,
                notifications_enabled,
                email_notifications,
                language,
                compact_mode
            `,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User settings not found."
            });
        }

        return res.json({
            success: true,
            message: "User settings updated successfully.",
            settings: result.rows[0]
        });
    } catch (error) {
        console.error("Update user settings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update user settings."
        });
    }
});

module.exports = function createUserSettingsRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};
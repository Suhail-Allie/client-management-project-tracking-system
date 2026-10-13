const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const pool = require("./config/database");
const supabase = require("./config/supabase");
const createClientsRouter = require("./routes/clients");
const createProjectsRouter = require("./routes/projects");
const createNotificationsRouter = require("./routes/notifications");
const createUserSettingsRouter = require("./routes/user-settings");
const createReportsRouter = require("./routes/reports");
const createMilestonesRouter = require("./routes/milestones");
const createDocumentsRouter = require("./routes/documents");
const createInvoicesRouter = require("./routes/invoices");
const createPaymentsRouter = require("./routes/payments");

// Separate client for normal authentication operations.
// The secret key remains exclusively on the backend.
const authClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

async function getProfile(userId) {
    const result = await pool.query(
        `SELECT
            id,
            display_name,
            email,
            phone,
            role,
            is_active,
            created_at,
            updated_at
         FROM profiles
         WHERE id = $1
         LIMIT 1`,
        [userId]
    );

    return result.rows[0] || null;
}

function formatSession(session) {
    if (!session) {
        return null;
    }

    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: session.token_type,
        expires_in: session.expires_in,
        expires_at: session.expires_at
    };
}

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

async function requireAuth(req, res, next) {
    try {
        const authorization = req.get("Authorization") || "";
        const match = authorization.match(/^Bearer\s+(.+)$/i);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        const accessToken = match[1];

        // Verify the token against Supabase Auth.
        const { data, error } = await authClient.auth.getUser(
            accessToken
        );

        if (error || !data.user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token."
            });
        }

        const profile = await getProfile(data.user.id);

        if (!profile) {
            return res.status(403).json({
                success: false,
                message: "No application profile was found."
            });
        }

        if (!profile.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive."
            });
        }

        req.authUser = data.user;
        req.profile = profile;
        req.accessToken = accessToken;

        next();
    } catch (error) {
        console.error(
            "Authentication middleware failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify authentication."
        });
    }
}

// --------------------------------------------------
// GENERAL API ROUTES
// --------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Client Management & Project Tracking System API"
    });
});

app.get("/api/v1/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy"
    });
});

app.get("/api/v1/health/db", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database_name, NOW() AS database_time"
        );

        res.json({
            success: true,
            status: "connected",
            database: result.rows[0].database_name,
            databaseTime: result.rows[0].database_time
        });
    } catch (error) {
        console.error(
            "Database health check failed:",
            error.message
        );

        res.status(503).json({
            success: false,
            status: "unavailable",
            message: "Database connection failed"
        });
    }
});

app.get("/api/v1/health/auth", async (req, res) => {
    try {
        const { error } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1
        });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            status: "connected"
        });
    } catch (error) {
        console.error(
            "Supabase Auth health check failed:",
            error.message
        );

        res.status(503).json({
            success: false,
            status: "unavailable",
            message: "Supabase Auth connection failed"
        });
    }
});

// --------------------------------------------------
// REGISTER
// POST /api/v1/auth/register
// --------------------------------------------------

app.post("/api/v1/auth/register", async (req, res) => {
    try {
        const body = req.body || {};

        const displayName =
            typeof body.displayName === "string"
                ? body.displayName.trim()
                : "";

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        const phone =
            typeof body.phone === "string"
                ? body.phone.trim()
                : null;

        if (displayName.length < 2 || displayName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Display name must contain 2 to 100 characters."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address."
            });
        }

        if (password.length < 12) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 12 characters."
            });
        }

        // New registrations do not choose their own role.
        // The database trigger assigns the default client role.
        const { data, error } = await authClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    phone
                }
            }
        });

        if (error) {
            console.error(
                "Registration failed:",
                error.message
            );

            return res.status(400).json({
                success: false,
                message:
                    "Unable to complete registration. Check the supplied details and try again."
            });
        }

        return res.status(201).json({
            success: true,
            message: data.session
                ? "Account created successfully."
                : "Registration submitted. Check your email if confirmation is required.",
            user: data.user
                ? {
                    id: data.user.id,
                    email: data.user.email
                }
                : null,
            session: formatSession(data.session)
        });
    } catch (error) {
        console.error(
            "Registration endpoint failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "An unexpected registration error occurred."
        });
    }
});

// --------------------------------------------------
// LOGIN
// POST /api/v1/auth/login
// --------------------------------------------------

app.post("/api/v1/auth/login", async (req, res) => {
    try {
        const body = req.body || {};

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const { data, error } =
            await authClient.auth.signInWithPassword({
                email,
                password
            });

        if (error || !data.user || !data.session) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid credentials or email confirmation is required."
            });
        }

        const profile = await getProfile(data.user.id);

        if (!profile) {
            return res.status(403).json({
                success: false,
                message: "No application profile was found."
            });
        }

        if (!profile.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account is inactive."
            });
        }

        return res.json({
            success: true,
            message: "Login successful.",
            user: {
                id: data.user.id,
                email: data.user.email
            },
            profile,
            session: formatSession(data.session)
        });
    } catch (error) {
        console.error(
            "Login endpoint failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "An unexpected login error occurred."
        });
    }
});

// --------------------------------------------------
// REFRESH TOKEN
// POST /api/v1/auth/refresh
// --------------------------------------------------

app.post("/api/v1/auth/refresh", async (req, res) => {
    try {
        const refreshToken =
            typeof req.body?.refresh_token === "string"
                ? req.body.refresh_token
                : "";

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required."
            });
        }

        const { data, error } =
            await authClient.auth.refreshSession({
                refresh_token: refreshToken
            });

        if (error || !data.session) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token."
            });
        }

        return res.json({
            success: true,
            message: "Session refreshed successfully.",
            user: {
                id: data.user.id,
                email: data.user.email
            },
            session: formatSession(data.session)
        });
    } catch (error) {
        console.error(
            "Token refresh failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to refresh the session."
        });
    }
});

// --------------------------------------------------
// LOGOUT
// POST /api/v1/auth/logout
// --------------------------------------------------

app.post(
    "/api/v1/auth/logout",
    requireAuth,
    async (req, res) => {
        try {
            // Revoke the current session's refresh token.
            const { error } =
                await supabase.auth.admin.signOut(
                    req.accessToken,
                    "local"
                );

            if (error) {
                console.error(
                    "Logout failed:",
                    error.message
                );

                return res.status(400).json({
                    success: false,
                    message: "Unable to complete logout."
                });
            }

            return res.json({
                success: true,
                message:
                    "Logout successful. Clear the stored tokens on the client."
            });
        } catch (error) {
            console.error(
                "Logout endpoint failed:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "An unexpected logout error occurred."
            });
        }
    }
);

// --------------------------------------------------
// CURRENT USER
// GET /api/v1/auth/me
// Requires a valid access token.
// --------------------------------------------------

app.get(
    "/api/v1/auth/me",
    requireAuth,
    (req, res) => {
        res.json({
            success: true,
            user: {
                id: req.authUser.id,
                email: req.authUser.email
            },
            profile: req.profile
        });
    }
);

// --------------------------------------------------
// CLIENTS API
// --------------------------------------------------

app.use(
    "/api/v1/clients",
    createClientsRouter(requireAuth)
);

app.use(
    "/api/v1/projects",
    requireAuth,
    createProjectsRouter(requireAuth)
);

app.use(
    "/api/v1/notifications",
    requireAuth,
    createNotificationsRouter(requireAuth)
);

app.use(
    "/api/v1/user-settings",
    requireAuth,
    createUserSettingsRouter(requireAuth)
);

app.use(
    "/api/v1/reports",
    requireAuth,
    createReportsRouter(requireAuth)
);

app.use(
    "/api/v1/milestones",
    requireAuth,
    createMilestonesRouter(requireAuth)
);

app.use(
    "/api/v1/documents",
    requireAuth,
    createDocumentsRouter(requireAuth)
);

app.use(
    "/api/v1/invoices",
    requireAuth,
    createInvoicesRouter(requireAuth)
);

app.use(
    "/api/v1/payments",
    requireAuth,
    createPaymentsRouter(requireAuth)
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const pool = require("./config/database");
const supabase = require("./config/supabase");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

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
        console.error("Database health check failed:", error.message);

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
        console.error("Supabase Auth health check failed:", error.message);

        res.status(503).json({
            success: false,
            status: "unavailable",
            message: "Supabase Auth connection failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
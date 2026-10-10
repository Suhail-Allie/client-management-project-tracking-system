const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

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

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const METHODS = new Set([
    "eft",
    "card",
    "cash",
    "other"
]);

const STATUSES = new Set([
    "pending",
    "completed",
    "failed",
    "refunded"
]);

function isUuid(value) {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

function getPaymentScope(profile, placeholder = "$1") {
    switch (profile.role) {
        case "administrator":
        case "finance_manager":
            return {
                clause: "1=1",
                params: []
            };

        case "client":
            return {
                clause: `c.profile_id = ${placeholder}`,
                params: [profile.id]
            };

        default:
            return {
                clause: "1=0",
                params: []
            };
    }
}

function requireFinance(req, res, next) {
    if (
        req.profile.role !== "administrator" &&
        req.profile.role !== "finance_manager"
    ) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to manage payments."
        });
    }

    next();
}

function validatePayment(body, partial = false) {
    const errors = [];

    if (!partial || body.invoice_id !== undefined) {
        if (!isUuid(body.invoice_id)) {
            errors.push("A valid invoice_id is required.");
        }
    }

    if (!partial || body.amount !== undefined) {
        if (
            typeof body.amount !== "number" ||
            !Number.isFinite(body.amount) ||
            body.amount <= 0
        ) {
            errors.push("amount must be greater than zero.");
        }
    }

    if (!partial || body.payment_date !== undefined) {
        if (
            typeof body.payment_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(body.payment_date)
        ) {
            errors.push("payment_date must use YYYY-MM-DD format.");
        }
    }

    if (!partial || body.method !== undefined) {
        if (!METHODS.has(body.method)) {
            errors.push("Invalid payment method.");
        }
    }

    if (body.reference !== undefined && body.reference !== null) {
        if (
            typeof body.reference !== "string" ||
            body.reference.trim().length > 100
        ) {
            errors.push("reference must not exceed 100 characters.");
        }
    }

    if (body.status !== undefined && !STATUSES.has(body.status)) {
        errors.push("Invalid payment status.");
    }

    if (body.notes !== undefined && body.notes !== null) {
        if (
            typeof body.notes !== "string" ||
            body.notes.length > 2000
        ) {
            errors.push("notes must not exceed 2000 characters.");
        }
    }

    return errors;
}

async function getPaymentById(id, profile) {
    const scope = getPaymentScope(profile, "$2");

    const result = await pool.query(
        `
        SELECT
            pay.id,
            pay.invoice_id,
            pay.amount,
            pay.payment_date,
            pay.method,
            pay.reference,
            pay.status,
            pay.notes,
            pay.recorded_by,
            pay.created_at,
            i.invoice_number,
            i.total_amount,
            c.company_name,
            recorder.display_name AS recorded_by_name
        FROM public.payments pay
        INNER JOIN public.invoices i
            ON i.id = pay.invoice_id
        INNER JOIN public.clients c
            ON c.id = i.client_id
        LEFT JOIN public.profiles recorder
            ON recorder.id = pay.recorded_by
        WHERE pay.id = $1
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
        const scope = getPaymentScope(req.profile);

        const result = await pool.query(
            `
            SELECT
                pay.id,
                pay.invoice_id,
                pay.amount,
                pay.payment_date,
                pay.method,
                pay.reference,
                pay.status,
                pay.notes,
                pay.recorded_by,
                pay.created_at,
                i.invoice_number,
                i.total_amount,
                c.company_name,
                recorder.display_name AS recorded_by_name
            FROM public.payments pay
            INNER JOIN public.invoices i
                ON i.id = pay.invoice_id
            INNER JOIN public.clients c
                ON c.id = i.client_id
            LEFT JOIN public.profiles recorder
                ON recorder.id = pay.recorded_by
            WHERE ${scope.clause}
            ORDER BY pay.payment_date DESC, pay.created_at DESC
            `,
            scope.params
        );

        return res.json({
            success: true,
            count: result.rows.length,
            payments: result.rows
        });
    } catch (error) {
        console.error("Get payments error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve payments."
        });
    }
});

// GET ONE
router.get("/:id", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID."
            });
        }

        const payment = await getPaymentById(
            req.params.id,
            req.profile
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        return res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error("Get payment error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the payment."
        });
    }
});

// CREATE
router.post("/", requireFinance, async (req, res) => {
    try {
        const errors = validatePayment(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment data.",
                errors
            });
        }

        const {
            invoice_id,
            amount,
            payment_date,
            method,
            reference = null,
            status = "pending",
            notes = null
        } = req.body;

        const invoice = await pool.query(
            `
            SELECT id
            FROM public.invoices
            WHERE id = $1
            LIMIT 1
            `,
            [invoice_id]
        );

        if (!invoice.rows[0]) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found."
            });
        }

        const result = await pool.query(
            `
            INSERT INTO public.payments
                (
                    invoice_id,
                    amount,
                    payment_date,
                    method,
                    reference,
                    status,
                    notes,
                    recorded_by
                )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING id
            `,
            [
                invoice_id,
                amount,
                payment_date,
                method,
                reference?.trim() || null,
                status,
                notes,
                req.profile.id
            ]
        );

        const payment = await getPaymentById(
            result.rows[0].id,
            req.profile
        );

        return res.status(201).json({
            success: true,
            message: "Payment created successfully.",
            payment
        });
    } catch (error) {
        console.error("Create payment error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Payment reference already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create the payment."
        });
    }
});

// UPDATE
router.patch("/:id", requireFinance, async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID."
            });
        }

        const existing = await getPaymentById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        const errors = validatePayment(req.body, true);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment data.",
                errors
            });
        }

        const allowed = [
            "amount",
            "payment_date",
            "method",
            "reference",
            "status",
            "notes"
        ];

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
            UPDATE public.payments
            SET ${updates.join(", ")}
            WHERE id = $${values.length}
            `,
            values
        );

        const payment = await getPaymentById(
            req.params.id,
            req.profile
        );

        return res.json({
            success: true,
            message: "Payment updated successfully.",
            payment
        });
    } catch (error) {
        console.error("Update payment error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Payment reference already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update the payment."
        });
    }
});

// DELETE
router.delete("/:id", requireFinance, async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID."
            });
        }

        const existing = await getPaymentById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        await pool.query(
            `DELETE FROM public.payments WHERE id = $1`,
            [req.params.id]
        );

        return res.json({
            success: true,
            message: "Payment deleted successfully."
        });
    } catch (error) {
        console.error("Delete payment error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the payment."
        });
    }
});

module.exports = function createPaymentsRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};
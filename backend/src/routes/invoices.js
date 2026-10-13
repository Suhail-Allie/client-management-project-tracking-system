const express = require("express");
const pool = require("../config/database");

const router = express.Router();

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set([
    "draft",
    "sent",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled"
]);

function isUuid(value) {
    return typeof value === "string" && UUID_PATTERN.test(value);
}

function getInvoiceScope(profile, placeholder = "$1") {
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
            message: "You do not have permission to manage invoices."
        });
    }

    next();
}

function validateInvoice(body, partial = false) {
    const errors = [];

    if (!partial || body.invoice_number !== undefined) {
        if (
            typeof body.invoice_number !== "string" ||
            body.invoice_number.trim().length === 0
        ) {
            errors.push("invoice_number is required.");
        } else if (body.invoice_number.trim().length > 100) {
            errors.push("invoice_number must not exceed 100 characters.");
        }
    }

    if (!partial || body.client_id !== undefined) {
        if (!isUuid(body.client_id)) {
            errors.push("A valid client_id is required.");
        }
    }

    if (!partial || body.project_id !== undefined) {
        if (!isUuid(body.project_id)) {
            errors.push("A valid project_id is required.");
        }
    }

    if (!partial || body.issue_date !== undefined) {
        if (
            typeof body.issue_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(body.issue_date)
        ) {
            errors.push("issue_date must use YYYY-MM-DD format.");
        }
    }

    if (!partial || body.due_date !== undefined) {
        if (
            typeof body.due_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)
        ) {
            errors.push("due_date must use YYYY-MM-DD format.");
        }
    }

    if (!partial || body.subtotal !== undefined) {
        if (
            typeof body.subtotal !== "number" ||
            !Number.isFinite(body.subtotal) ||
            body.subtotal < 0
        ) {
            errors.push("subtotal must be a non-negative number.");
        }
    }

    if (!partial || body.tax_amount !== undefined) {
        if (
            typeof body.tax_amount !== "number" ||
            !Number.isFinite(body.tax_amount) ||
            body.tax_amount < 0
        ) {
            errors.push("tax_amount must be a non-negative number.");
        }
    }

    if (body.currency !== undefined && body.currency !== "ZAR") {
        errors.push("currency must be ZAR.");
    }

    if (body.status !== undefined && !STATUSES.has(body.status)) {
        errors.push("Invalid invoice status.");
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

async function getInvoiceById(id, profile) {
    const scope = getInvoiceScope(profile, "$2");

    const result = await pool.query(
        `
        SELECT
            i.id,
            i.invoice_number,
            i.client_id,
            i.project_id,
            i.issue_date,
            i.due_date,
            i.subtotal,
            i.tax_amount,
            i.total_amount,
            i.currency,
            i.status,
            i.notes,
            i.created_by,
            i.created_at,
            i.updated_at,
            c.company_name,
            p.project_code,
            p.name AS project_name,
            COALESCE(
                (
                    SELECT SUM(pay.amount)
                    FROM public.payments pay
                    WHERE pay.invoice_id = i.id
                      AND pay.status = 'completed'
                ),
                0
            ) AS amount_paid
        FROM public.invoices i
        INNER JOIN public.clients c
            ON c.id = i.client_id
        INNER JOIN public.projects p
            ON p.id = i.project_id
        WHERE i.id = $1
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
        const scope = getInvoiceScope(req.profile);

        const result = await pool.query(
            `
            SELECT
                i.id,
                i.invoice_number,
                i.client_id,
                i.project_id,
                i.issue_date,
                i.due_date,
                i.subtotal,
                i.tax_amount,
                i.total_amount,
                i.currency,
                i.status,
                i.notes,
                i.created_at,
                i.updated_at,
                c.company_name,
                p.project_code,
                p.name AS project_name,
                COALESCE(
                    (
                        SELECT SUM(pay.amount)
                        FROM public.payments pay
                        WHERE pay.invoice_id = i.id
                          AND pay.status = 'completed'
                    ),
                    0
                ) AS amount_paid
            FROM public.invoices i
            INNER JOIN public.clients c
                ON c.id = i.client_id
            INNER JOIN public.projects p
                ON p.id = i.project_id
            WHERE ${scope.clause}
            ORDER BY i.created_at DESC
            `,
            scope.params
        );

        return res.json({
            success: true,
            count: result.rows.length,
            invoices: result.rows
        });
    } catch (error) {
        console.error("Get invoices error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve invoices."
        });
    }
});

// GET ONE
router.get("/:id", async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID."
            });
        }

        const invoice = await getInvoiceById(
            req.params.id,
            req.profile
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found."
            });
        }

        return res.json({
            success: true,
            invoice
        });
    } catch (error) {
        console.error("Get invoice error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the invoice."
        });
    }
});

// CREATE
router.post("/", requireFinance, async (req, res) => {
    try {
        const errors = validateInvoice(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice data.",
                errors
            });
        }

        const {
            invoice_number,
            client_id,
            project_id,
            issue_date,
            due_date,
            subtotal,
            tax_amount,
            currency = "ZAR",
            status = "draft",
            notes = null
        } = req.body;

        const relationship = await pool.query(
            `
            SELECT
                p.id,
                p.client_id
            FROM public.projects p
            WHERE p.id = $1
            LIMIT 1
            `,
            [project_id]
        );

        if (!relationship.rows[0]) {
            return res.status(404).json({
                success: false,
                message: "Project not found."
            });
        }

        if (relationship.rows[0].client_id !== client_id) {
            return res.status(400).json({
                success: false,
                message: "The project does not belong to the supplied client."
            });
        }

        const client = await pool.query(
            `SELECT id FROM public.clients WHERE id = $1 LIMIT 1`,
            [client_id]
        );

        if (!client.rows[0]) {
            return res.status(404).json({
                success: false,
                message: "Client not found."
            });
        }

        const result = await pool.query(
            `
            INSERT INTO public.invoices
                (
                    invoice_number,
                    client_id,
                    project_id,
                    issue_date,
                    due_date,
                    subtotal,
                    tax_amount,
                    currency,
                    status,
                    notes,
                    created_by
                )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id
            `,
            [
                invoice_number.trim(),
                client_id,
                project_id,
                issue_date,
                due_date,
                subtotal,
                tax_amount,
                currency,
                status,
                notes,
req.profile.id
            ]
        );

        const invoice = await getInvoiceById(
            result.rows[0].id,
            req.profile
        );

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully.",
            invoice
        });
    } catch (error) {
        console.error("Create invoice error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Invoice number already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create the invoice."
        });
    }
});

// UPDATE
router.patch("/:id", requireFinance, async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID."
            });
        }

        const existing = await getInvoiceById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found."
            });
        }

        const errors = validateInvoice(req.body, true);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice data.",
                errors
            });
        }

        const allowed = [
            "invoice_number",
            "issue_date",
            "due_date",
            "subtotal",
            "tax_amount",
            "currency",
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
            UPDATE public.invoices
            SET ${updates.join(", ")},
                updated_at = NOW()
            WHERE id = $${values.length}
            `,
            values
        );

        const invoice = await getInvoiceById(
            req.params.id,
            req.profile
        );

        return res.json({
            success: true,
            message: "Invoice updated successfully.",
            invoice
        });
    } catch (error) {
        console.error("Update invoice error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Invoice number already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update the invoice."
        });
    }
});

// DELETE
router.delete("/:id", requireFinance, async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invoice ID."
            });
        }

        const existing = await getInvoiceById(
            req.params.id,
            req.profile
        );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found."
            });
        }

        await pool.query(
            `DELETE FROM public.invoices WHERE id = $1`,
            [req.params.id]
        );

        return res.json({
            success: true,
            message: "Invoice deleted successfully."
        });
    } catch (error) {
        console.error("Delete invoice error:", error.message);

        if (error.code === "23503") {
            return res.status(409).json({
                success: false,
                message: "Invoice cannot be deleted because it has payment records."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to delete the invoice."
        });
    }
});

module.exports = function createInvoicesRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};
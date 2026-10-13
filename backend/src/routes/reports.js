const express = require("express");
const pool = require("../config/database");

const router = express.Router();

function getScope(profile) {
    switch (profile.role) {
        case "administrator":
        case "finance_manager":
            return {
                clients: {
                    clause: "1=1",
                    params: []
                },
                projects: {
                    clause: "1=1",
                    params: []
                },
                milestones: {
                    clause: "1=1",
                    params: []
                },
                documents: {
                    clause: "1=1",
                    params: []
                },
                invoices: {
                    clause: "1=1",
                    params: []
                },
                payments: {
                    clause: "1=1",
                    params: []
                }
            };

        case "developer":
            return {
                clients: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.projects cp
                            WHERE cp.client_id = c.id
                              AND cp.assigned_developer_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                projects: {
                    clause: "p.assigned_developer_id = $1",
                    params: [profile.id]
                },

                milestones: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.projects mp
                            WHERE mp.id = m.project_id
                              AND mp.assigned_developer_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                documents: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.projects dp
                            WHERE dp.id = d.project_id
                              AND dp.assigned_developer_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                invoices: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.projects ip
                            WHERE ip.id = i.project_id
                              AND ip.assigned_developer_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                payments: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.invoices pi
                            INNER JOIN public.projects pp
                                ON pp.id = pi.project_id
                            WHERE pi.id = pay.invoice_id
                              AND pp.assigned_developer_id = $1
                        )
                    `,
                    params: [profile.id]
                }
            };

        case "client":
            return {
                clients: {
                    clause: "c.profile_id = $1",
                    params: [profile.id]
                },

                projects: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.clients pc
                            WHERE pc.id = p.client_id
                              AND pc.profile_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                milestones: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.projects mp
                            INNER JOIN public.clients mc
                                ON mc.id = mp.client_id
                            WHERE mp.id = m.project_id
                              AND mc.profile_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                documents: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.projects dp
                            INNER JOIN public.clients dc
                                ON dc.id = dp.client_id
                            WHERE dp.id = d.project_id
                              AND dc.profile_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                invoices: {
                    clause: `
                        i.client_id IN (
                            SELECT id
                            FROM public.clients
                            WHERE profile_id = $1
                        )
                    `,
                    params: [profile.id]
                },

                payments: {
                    clause: `
                        EXISTS (
                            SELECT 1
                            FROM public.invoices pi
                            INNER JOIN public.clients pc
                                ON pc.id = pi.client_id
                            WHERE pi.id = pay.invoice_id
                              AND pc.profile_id = $1
                        )
                    `,
                    params: [profile.id]
                }
            };

        default:
            return {
                clients: {
                    clause: "1=0",
                    params: []
                },
                projects: {
                    clause: "1=0",
                    params: []
                },
                milestones: {
                    clause: "1=0",
                    params: []
                },
                documents: {
                    clause: "1=0",
                    params: []
                },
                invoices: {
                    clause: "1=0",
                    params: []
                },
                payments: {
                    clause: "1=0",
                    params: []
                }
            };
    }
}

function normaliseScope(scope) {
    if (typeof scope === "string") {
        return {
            clause: scope,
            params: []
        };
    }

    return scope;
}

// GET REPORT SUMMARY
router.get("/summary", async (req, res) => {
    try {
        const scope = getScope(req.profile);

        const clientScope = normaliseScope(scope.clients);
        const projectScope = normaliseScope(scope.projects);
        const milestoneScope = normaliseScope(scope.milestones);
        const documentScope = normaliseScope(scope.documents);
        const invoiceScope = normaliseScope(scope.invoices);
        const paymentScope = normaliseScope(scope.payments);

        const [
            clientsResult,
            projectsResult,
            milestonesResult,
            documentsResult,
            invoicesResult,
            paymentsResult,
            projectStatusResult,
            milestoneStatusResult,
            invoiceStatusResult,
            financialResult
        ] = await Promise.all([
            pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM public.clients c
                WHERE ${clientScope.clause}
                `,
                clientScope.params
            ),

            pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM public.projects p
                WHERE ${projectScope.clause}
                `,
                projectScope.params
            ),

            pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM public.milestones m
                WHERE ${milestoneScope.clause}
                `,
                milestoneScope.params
            ),

            pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM public.documents d
                WHERE ${documentScope.clause}
                `,
                documentScope.params
            ),

            pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM public.invoices i
                WHERE ${invoiceScope.clause}
                `,
                invoiceScope.params
            ),

            pool.query(
                `
                SELECT COUNT(*)::int AS count
                FROM public.payments pay
                WHERE ${paymentScope.clause}
                `,
                paymentScope.params
            ),

            pool.query(
                `
                SELECT
                    p.status,
                    COUNT(*)::int AS count
                FROM public.projects p
                WHERE ${projectScope.clause}
                GROUP BY p.status
                ORDER BY p.status
                `,
                projectScope.params
            ),

            pool.query(
                `
                SELECT
                    m.status,
                    COUNT(*)::int AS count
                FROM public.milestones m
                WHERE ${milestoneScope.clause}
                GROUP BY m.status
                ORDER BY m.status
                `,
                milestoneScope.params
            ),

            pool.query(
                `
                SELECT
                    i.status,
                    COUNT(*)::int AS count,
                    COALESCE(
                        SUM(i.total_amount),
                        0
                    )::numeric AS total_amount
                FROM public.invoices i
                WHERE ${invoiceScope.clause}
                GROUP BY i.status
                ORDER BY i.status
                `,
                invoiceScope.params
            ),

            pool.query(
                `
                SELECT
                    COALESCE(
                        SUM(i.total_amount),
                        0
                    )::numeric AS total_invoiced,

                    COALESCE(
                        SUM(
                            COALESCE(payments.total_paid, 0)
                        ),
                        0
                    )::numeric AS total_paid,

                    GREATEST(
                        COALESCE(
                            SUM(i.total_amount),
                            0
                        )::numeric
                        -
                        COALESCE(
                            SUM(
                                COALESCE(payments.total_paid, 0)
                            ),
                            0
                        )::numeric,
                        0
                    )::numeric AS total_outstanding

                FROM public.invoices i

                LEFT JOIN (
                    SELECT
                        invoice_id,
                        SUM(
                            CASE
                                WHEN status = 'completed'
                                THEN amount
                                ELSE 0
                            END
                        ) AS total_paid
                    FROM public.payments
                    GROUP BY invoice_id
                ) payments
                    ON payments.invoice_id = i.id

                WHERE ${invoiceScope.clause}
                `,
                invoiceScope.params
            )
        ]);

        const financial = financialResult.rows[0];

        const invoiceStatus = invoiceStatusResult.rows.map(row => ({
            status: row.status,
            count: row.count,
            total_amount: Number(row.total_amount)
        }));

        return res.json({
            success: true,

            report: {
                generated_at: new Date().toISOString(),

                role: req.profile.role,

                totals: {
                    clients: clientsResult.rows[0].count,
                    projects: projectsResult.rows[0].count,
                    milestones: milestonesResult.rows[0].count,
                    documents: documentsResult.rows[0].count,
                    invoices: invoicesResult.rows[0].count,
                    payments: paymentsResult.rows[0].count
                },

                project_status: projectStatusResult.rows,

                milestone_status: milestoneStatusResult.rows,

                invoice_status: invoiceStatus,

                financial: {
                    total_invoiced: Number(
                        financial.total_invoiced
                    ),

                    total_paid: Number(
                        financial.total_paid
                    ),

                    total_outstanding: Number(
                        financial.total_outstanding
                    )
                }
            }
        });
    } catch (error) {
        console.error(
            "Get report summary error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to generate the report summary."
        });
    }
});

module.exports = function createReportsRouter(requireAuth) {
    router.use(requireAuth);
    return router;
};
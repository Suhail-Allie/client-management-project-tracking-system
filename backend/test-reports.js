require("dotenv").config();

const { Pool } = require("pg");

const BASE_URL = "http://localhost:3000/api/v1";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    return {
        status: response.status,
        data
    };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function login(email, password) {
    const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });

    assert(
        result.status === 200,
        `Login failed for ${email}: ${JSON.stringify(result.data)}`
    );

    const token =
        result.data?.session?.accessToken ||
        result.data?.session?.access_token ||
        result.data?.accessToken ||
        result.data?.access_token;

    assert(token, `No access token returned for ${email}.`);

    return token;
}

function validateReport(report, role) {
    assert(report, `${role}: report object missing.`);

    assert(
        report.role === role,
        `${role}: report role does not match authenticated role.`
    );

    assert(
        report.totals,
        `${role}: report totals missing.`
    );

    const totalFields = [
        "clients",
        "projects",
        "milestones",
        "documents",
        "invoices",
        "payments"
    ];

    for (const field of totalFields) {
        assert(
            Number.isInteger(report.totals[field]) &&
            report.totals[field] >= 0,
            `${role}: invalid total for ${field}.`
        );
    }

    assert(
        Array.isArray(report.project_status),
        `${role}: project_status is not an array.`
    );

    assert(
        Array.isArray(report.milestone_status),
        `${role}: milestone_status is not an array.`
    );

    assert(
        Array.isArray(report.invoice_status),
        `${role}: invoice_status is not an array.`
    );

    assert(
        report.financial,
        `${role}: financial report missing.`
    );

    assert(
        typeof report.financial.total_invoiced === "number",
        `${role}: total_invoiced is not numeric.`
    );

    assert(
        typeof report.financial.total_paid === "number",
        `${role}: total_paid is not numeric.`
    );

    assert(
        typeof report.financial.total_outstanding === "number",
        `${role}: total_outstanding is not numeric.`
    );

    assert(
        report.financial.total_invoiced >= 0,
        `${role}: total_invoiced cannot be negative.`
    );

    assert(
        report.financial.total_paid >= 0,
        `${role}: total_paid cannot be negative.`
    );

    assert(
        report.financial.total_outstanding >= 0,
        `${role}: total_outstanding cannot be negative.`
    );
}

async function main() {
    console.log("\nREPORTS API TEST\n");

    const password = process.env.SEED_USER_PASSWORD;

    assert(
        password,
        "SEED_USER_PASSWORD is missing from .env"
    );

    // --------------------------------------------------
    // 1. Unauthenticated access
    // --------------------------------------------------
    const unauthenticated = await request(
        "/reports/summary"
    );

    assert(
        unauthenticated.status === 401,
        `Unauthenticated report access should return 401, got ${unauthenticated.status}.`
    );

    console.log("UNAUTHENTICATED ACCESS: PASS");

    // --------------------------------------------------
    // 2. Get demo users for all roles
    // --------------------------------------------------
    const profilesResult = await pool.query(`
        SELECT id, email, role
        FROM public.profiles
        WHERE role IN (
            'administrator',
            'developer',
            'finance_manager',
            'client'
        )
          AND is_active = true
        ORDER BY role
    `);

    assert(
        profilesResult.rows.length >= 4,
        "Could not find active users for all four required roles."
    );

    const usersByRole = {};

    for (const user of profilesResult.rows) {
        if (!usersByRole[user.role]) {
            usersByRole[user.role] = user;
        }
    }

    const requiredRoles = [
        "administrator",
        "developer",
        "finance_manager",
        "client"
    ];

    for (const role of requiredRoles) {
        assert(
            usersByRole[role],
            `No active ${role} user found.`
        );
    }

    // --------------------------------------------------
    // 3. Administrator report
    // --------------------------------------------------
    const adminToken = await login(
        usersByRole.administrator.email,
        password
    );

    const adminReport = await request(
        "/reports/summary",
        {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    assert(
        adminReport.status === 200,
        `Administrator report failed: ${JSON.stringify(adminReport.data)}`
    );

    validateReport(
        adminReport.data.report,
        "administrator"
    );

    console.log("ADMINISTRATOR REPORT: PASS");

    const adminTotals = adminReport.data.report.totals;
    const adminFinancial = adminReport.data.report.financial;

    // --------------------------------------------------
    // 4. Finance Manager report
    // --------------------------------------------------
    const financeToken = await login(
        usersByRole.finance_manager.email,
        password
    );

    const financeReport = await request(
        "/reports/summary",
        {
            headers: {
                Authorization: `Bearer ${financeToken}`
            }
        }
    );

    assert(
        financeReport.status === 200,
        `Finance Manager report failed: ${JSON.stringify(financeReport.data)}`
    );

    validateReport(
        financeReport.data.report,
        "finance_manager"
    );

    console.log("FINANCE MANAGER REPORT: PASS");

    // Finance Manager should have the same full reporting scope
    assert(
        financeReport.data.report.totals.projects ===
            adminTotals.projects,
        "Finance Manager project scope does not match administrator scope."
    );

    assert(
        financeReport.data.report.totals.invoices ===
            adminTotals.invoices,
        "Finance Manager invoice scope does not match administrator scope."
    );

    assert(
        financeReport.data.report.totals.payments ===
            adminTotals.payments,
        "Finance Manager payment scope does not match administrator scope."
    );

    console.log("FINANCE MANAGER SCOPE: PASS");

    // --------------------------------------------------
    // 5. Developer report
    // --------------------------------------------------
    const developerToken = await login(
        usersByRole.developer.email,
        password
    );

    const developerReport = await request(
        "/reports/summary",
        {
            headers: {
                Authorization: `Bearer ${developerToken}`
            }
        }
    );

    assert(
        developerReport.status === 200,
        `Developer report failed: ${JSON.stringify(developerReport.data)}`
    );

    validateReport(
        developerReport.data.report,
        "developer"
    );

    console.log("DEVELOPER REPORT: PASS");

    const developerTotals =
        developerReport.data.report.totals;

    assert(
        developerTotals.projects <= adminTotals.projects,
        "Developer project scope exceeds administrator scope."
    );

    assert(
        developerTotals.milestones <= adminTotals.milestones,
        "Developer milestone scope exceeds administrator scope."
    );

    assert(
        developerTotals.documents <= adminTotals.documents,
        "Developer document scope exceeds administrator scope."
    );

    assert(
        developerTotals.invoices <= adminTotals.invoices,
        "Developer invoice scope exceeds administrator scope."
    );

    assert(
        developerTotals.payments <= adminTotals.payments,
        "Developer payment scope exceeds administrator scope."
    );

    assert(
        developerReport.data.report.financial.total_invoiced <=
            adminFinancial.total_invoiced,
        "Developer financial scope exceeds administrator scope."
    );

    console.log("DEVELOPER SCOPE: PASS");

    // --------------------------------------------------
    // 6. Client report
    // --------------------------------------------------
    const clientToken = await login(
        usersByRole.client.email,
        password
    );

    const clientReport = await request(
        "/reports/summary",
        {
            headers: {
                Authorization: `Bearer ${clientToken}`
            }
        }
    );

    assert(
        clientReport.status === 200,
        `Client report failed: ${JSON.stringify(clientReport.data)}`
    );

    validateReport(
        clientReport.data.report,
        "client"
    );

    console.log("CLIENT REPORT: PASS");

    const clientTotals =
        clientReport.data.report.totals;

    assert(
        clientTotals.projects <= adminTotals.projects,
        "Client project scope exceeds administrator scope."
    );

    assert(
        clientTotals.milestones <= adminTotals.milestones,
        "Client milestone scope exceeds administrator scope."
    );

    assert(
        clientTotals.documents <= adminTotals.documents,
        "Client document scope exceeds administrator scope."
    );

    assert(
        clientTotals.invoices <= adminTotals.invoices,
        "Client invoice scope exceeds administrator scope."
    );

    assert(
        clientTotals.payments <= adminTotals.payments,
        "Client payment scope exceeds administrator scope."
    );

    assert(
        clientReport.data.report.financial.total_invoiced <=
            adminFinancial.total_invoiced,
        "Client financial scope exceeds administrator scope."
    );

    console.log("CLIENT SCOPE: PASS");

    // --------------------------------------------------
    // 7. Report contains actual database data
    // --------------------------------------------------
    assert(
        adminTotals.projects > 0,
        "Administrator report contains no projects."
    );

    assert(
        adminTotals.clients > 0,
        "Administrator report contains no clients."
    );

    assert(
        adminTotals.invoices > 0,
        "Administrator report contains no invoices."
    );

    assert(
        adminTotals.payments > 0,
        "Administrator report contains no payments."
    );

    console.log("DATABASE REPORT DATA: PASS");

    console.log("\nREPORTS API TEST: ALL PASSED\n");
}

main()
    .catch(error => {
        console.error("\nTEST FAILED:");
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
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

async function main() {
    console.log("\nINVOICES + PAYMENTS API TEST\n");

    // --------------------------------------------------
    // 1. Find seeded administrator
    // --------------------------------------------------
    const adminResult = await pool.query(`
        SELECT email
        FROM profiles
        WHERE role = 'administrator'
          AND is_active = true
        LIMIT 1
    `);

    assert(adminResult.rows.length > 0, "No active administrator found.");

    const email = adminResult.rows[0].email;
    const password = process.env.SEED_USER_PASSWORD;

    assert(password, "SEED_USER_PASSWORD is missing from .env");

    // --------------------------------------------------
    // 2. Login
    // --------------------------------------------------
    const login = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });

    assert(login.status === 200, `Login failed: ${JSON.stringify(login.data)}`);

    const token =
        login.data?.session?.accessToken ||
        login.data?.session?.access_token ||
        login.data?.accessToken ||
        login.data?.access_token;

    assert(token, "No access token returned from login.");

    console.log("AUTHENTICATION: PASS");

    const authHeaders = {
        Authorization: `Bearer ${token}`
    };

    // --------------------------------------------------
    // 3. Get an existing project/client
    // --------------------------------------------------
    const projects = await request("/projects", {
        headers: authHeaders
    });

    assert(projects.status === 200, "Could not retrieve projects.");

    const project = projects.data.projects?.[0];

    assert(project, "No project available for invoice test.");

    const clientId = project.client_id;
    const projectId = project.id;

    console.log("TEST PROJECT: PASS");

    // --------------------------------------------------
    // 4. CREATE INVOICE
    // --------------------------------------------------
    const invoiceNumber = `API-TEST-${Date.now()}`;

    const createInvoice = await request("/invoices", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            invoice_number: invoiceNumber,
            client_id: clientId,
            project_id: projectId,
            issue_date: "2026-10-12",
            due_date: "2026-11-11",
            subtotal: 1000,
            tax_amount: 150,
            currency: "ZAR",
            status: "sent",
            notes: "Automated API test invoice"
        })
    });

    assert(
        createInvoice.status === 201,
        `Invoice CREATE failed: ${JSON.stringify(createInvoice.data)}`
    );

    const invoice = createInvoice.data.invoice;

    assert(invoice?.id, "Created invoice has no ID.");

    console.log("INVOICE CREATE: PASS");

    // --------------------------------------------------
    // 5. READ INVOICE
    // --------------------------------------------------
    const readInvoice = await request(`/invoices/${invoice.id}`, {
        headers: authHeaders
    });

    assert(
        readInvoice.status === 200,
        `Invoice READ failed: ${JSON.stringify(readInvoice.data)}`
    );

    assert(
        readInvoice.data.invoice?.invoice_number === invoiceNumber,
        "Invoice read-back data does not match."
    );

    console.log("INVOICE READ: PASS");

    // --------------------------------------------------
    // 6. UPDATE INVOICE
    // --------------------------------------------------
    const updateInvoice = await request(`/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
            status: "partially_paid",
            notes: "Updated by automated API test"
        })
    });

    assert(
        updateInvoice.status === 200,
        `Invoice UPDATE failed: ${JSON.stringify(updateInvoice.data)}`
    );

    console.log("INVOICE UPDATE: PASS");

    // --------------------------------------------------
    // 7. Verify invoice update persisted
    // --------------------------------------------------
    const verifyInvoice = await request(`/invoices/${invoice.id}`, {
        headers: authHeaders
    });

    assert(
        verifyInvoice.data.invoice?.status === "partially_paid",
        "Invoice status update did not persist."
    );

    console.log("INVOICE UPDATE PERSISTENCE: PASS");

    // --------------------------------------------------
    // 8. CREATE PAYMENT
    // --------------------------------------------------
    const paymentReference = `API-PAY-${Date.now()}`;

    const createPayment = await request("/payments", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            invoice_id: invoice.id,
            amount: 500,
            payment_date: "2026-10-12",
            method: "eft",
            reference: paymentReference,
            status: "completed",
            notes: "Automated API test payment"
        })
    });

    assert(
        createPayment.status === 201,
        `Payment CREATE failed: ${JSON.stringify(createPayment.data)}`
    );

    const payment = createPayment.data.payment;

    assert(payment?.id, "Created payment has no ID.");

    console.log("PAYMENT CREATE: PASS");

    // --------------------------------------------------
    // 9. READ PAYMENT
    // --------------------------------------------------
    const readPayment = await request(`/payments/${payment.id}`, {
        headers: authHeaders
    });

    assert(
        readPayment.status === 200,
        `Payment READ failed: ${JSON.stringify(readPayment.data)}`
    );

    assert(
        readPayment.data.payment?.reference === paymentReference,
        "Payment read-back data does not match."
    );

    console.log("PAYMENT READ: PASS");

    // --------------------------------------------------
    // 10. UPDATE PAYMENT
    // --------------------------------------------------
    const updatePayment = await request(`/payments/${payment.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
            amount: 600,
            notes: "Updated payment test"
        })
    });

    assert(
        updatePayment.status === 200,
        `Payment UPDATE failed: ${JSON.stringify(updatePayment.data)}`
    );

    console.log("PAYMENT UPDATE: PASS");

    // --------------------------------------------------
    // 11. Verify payment update persisted
    // --------------------------------------------------
    const verifyPayment = await request(`/payments/${payment.id}`, {
        headers: authHeaders
    });

    assert(
        Number(verifyPayment.data.payment?.amount) === 600,
        "Payment amount update did not persist."
    );

    console.log("PAYMENT UPDATE PERSISTENCE: PASS");

    // --------------------------------------------------
    // 12. Invalid payment input
    // --------------------------------------------------
    const invalidPayment = await request("/payments", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            invoice_id: "not-a-uuid",
            amount: -50,
            method: "invalid",
            status: "invalid"
        })
    });

    assert(
        invalidPayment.status >= 400 && invalidPayment.status < 500,
        "Invalid payment input was not rejected."
    );

    console.log("INVALID PAYMENT INPUT: PASS");

    // --------------------------------------------------
    // 13. DELETE PAYMENT
    // --------------------------------------------------
    const deletePayment = await request(`/payments/${payment.id}`, {
        method: "DELETE",
        headers: authHeaders
    });

    assert(
        deletePayment.status === 200,
        `Payment DELETE failed: ${JSON.stringify(deletePayment.data)}`
    );

    console.log("PAYMENT DELETE: PASS");

    // --------------------------------------------------
    // 14. Verify payment deletion
    // --------------------------------------------------
    const deletedPayment = await request(`/payments/${payment.id}`, {
        headers: authHeaders
    });

    assert(
        deletedPayment.status === 404,
        "Deleted payment can still be retrieved."
    );

    console.log("PAYMENT DELETE PERSISTENCE: PASS");

    // --------------------------------------------------
    // 15. DELETE INVOICE
    // --------------------------------------------------
    const deleteInvoice = await request(`/invoices/${invoice.id}`, {
        method: "DELETE",
        headers: authHeaders
    });

    assert(
        deleteInvoice.status === 200,
        `Invoice DELETE failed: ${JSON.stringify(deleteInvoice.data)}`
    );

    console.log("INVOICE DELETE: PASS");

    // --------------------------------------------------
    // 16. Verify invoice deletion
    // --------------------------------------------------
    const deletedInvoice = await request(`/invoices/${invoice.id}`, {
        headers: authHeaders
    });

    assert(
        deletedInvoice.status === 404,
        "Deleted invoice can still be retrieved."
    );

    console.log("INVOICE DELETE PERSISTENCE: PASS");

    console.log("\nINVOICES + PAYMENTS API TEST: ALL PASSED\n");
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
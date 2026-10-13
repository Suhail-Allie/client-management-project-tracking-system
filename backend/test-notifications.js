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
    console.log("\nNOTIFICATIONS API TEST\n");

    // --------------------------------------------------
    // 1. Find seeded administrator
    // --------------------------------------------------
    const adminResult = await pool.query(`
        SELECT id, email
        FROM profiles
        WHERE role = 'administrator'
          AND is_active = true
        LIMIT 1
    `);

    assert(
        adminResult.rows.length > 0,
        "No active administrator found."
    );

    const admin = adminResult.rows[0];

    const password = process.env.SEED_USER_PASSWORD;

    assert(
        password,
        "SEED_USER_PASSWORD is missing from .env"
    );

    // --------------------------------------------------
    // 2. Login
    // --------------------------------------------------
    const login = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: admin.email,
            password
        })
    });

    assert(
        login.status === 200,
        `Login failed: ${JSON.stringify(login.data)}`
    );

    const token =
        login.data?.session?.accessToken ||
        login.data?.session?.access_token ||
        login.data?.accessToken ||
        login.data?.access_token;

    assert(
        token,
        "No access token returned from login."
    );

    console.log("AUTHENTICATION: PASS");

    const authHeaders = {
        Authorization: `Bearer ${token}`
    };

    // --------------------------------------------------
    // 3. Get an existing project
    // --------------------------------------------------
    const projects = await request("/projects", {
        headers: authHeaders
    });

    assert(
        projects.status === 200,
        "Could not retrieve projects."
    );

    const project = projects.data.projects?.[0];

    assert(
        project,
        "No project available for notification test."
    );

    console.log("TEST PROJECT: PASS");

    // --------------------------------------------------
    // 4. CREATE NOTIFICATION
    // --------------------------------------------------
    const createNotification = await request("/notifications", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            user_id: admin.id,
            title: "API Test Notification",
            message: "This notification was created by the automated API test.",
            type: "system",
            is_read: false,
            related_project_id: project.id
        })
    });

    assert(
        createNotification.status === 201,
        `Notification CREATE failed: ${JSON.stringify(createNotification.data)}`
    );

    const notification =
        createNotification.data.notification;

    assert(
        notification?.id,
        "Created notification has no ID."
    );

    console.log("NOTIFICATION CREATE: PASS");

    // --------------------------------------------------
    // 5. READ NOTIFICATION
    // --------------------------------------------------
    const readNotification = await request(
        `/notifications/${notification.id}`,
        {
            headers: authHeaders
        }
    );

    assert(
        readNotification.status === 200,
        `Notification READ failed: ${JSON.stringify(readNotification.data)}`
    );

    assert(
        readNotification.data.notification?.title ===
            "API Test Notification",
        "Notification read-back data does not match."
    );

    console.log("NOTIFICATION READ: PASS");

    // --------------------------------------------------
    // 6. UPDATE NOTIFICATION
    // --------------------------------------------------
    const updateNotification = await request(
        `/notifications/${notification.id}`,
        {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({
                title: "Updated API Test Notification",
                is_read: true
            })
        }
    );

    assert(
        updateNotification.status === 200,
        `Notification UPDATE failed: ${JSON.stringify(updateNotification.data)}`
    );

    console.log("NOTIFICATION UPDATE: PASS");

    // --------------------------------------------------
    // 7. VERIFY UPDATE PERSISTED
    // --------------------------------------------------
    const verifyNotification = await request(
        `/notifications/${notification.id}`,
        {
            headers: authHeaders
        }
    );

    assert(
        verifyNotification.data.notification?.title ===
            "Updated API Test Notification",
        "Notification title update did not persist."
    );

    assert(
        verifyNotification.data.notification?.is_read === true,
        "Notification read status update did not persist."
    );

    console.log("NOTIFICATION UPDATE PERSISTENCE: PASS");

    // --------------------------------------------------
    // 8. INVALID INPUT
    // --------------------------------------------------
    const invalidNotification = await request(
        "/notifications",
        {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                user_id: "not-a-uuid",
                title: "",
                message: "",
                type: ""
            })
        }
    );

    assert(
        invalidNotification.status >= 400 &&
        invalidNotification.status < 500,
        "Invalid notification input was not rejected."
    );

    console.log("INVALID NOTIFICATION INPUT: PASS");

    // --------------------------------------------------
    // 9. INVALID NOTIFICATION ID
    // --------------------------------------------------
    const invalidId = await request(
        "/notifications/not-a-valid-uuid",
        {
            headers: authHeaders
        }
    );

    assert(
        invalidId.status === 400,
        "Invalid notification ID was not rejected."
    );

    console.log("INVALID NOTIFICATION ID: PASS");

    // --------------------------------------------------
    // 10. DELETE NOTIFICATION
    // --------------------------------------------------
    const deleteNotification = await request(
        `/notifications/${notification.id}`,
        {
            method: "DELETE",
            headers: authHeaders
        }
    );

    assert(
        deleteNotification.status === 200,
        `Notification DELETE failed: ${JSON.stringify(deleteNotification.data)}`
    );

    console.log("NOTIFICATION DELETE: PASS");

    // --------------------------------------------------
    // 11. VERIFY DELETE PERSISTED
    // --------------------------------------------------
    const deletedNotification = await request(
        `/notifications/${notification.id}`,
        {
            headers: authHeaders
        }
    );

    assert(
        deletedNotification.status === 404,
        "Deleted notification can still be retrieved."
    );

    console.log("NOTIFICATION DELETE PERSISTENCE: PASS");

    console.log(
        "\nNOTIFICATIONS API TEST: ALL PASSED\n"
    );
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
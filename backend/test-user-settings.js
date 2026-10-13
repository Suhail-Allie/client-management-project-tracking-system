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
    console.log("\nUSER SETTINGS API TEST\n");

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
    // 3. READ CURRENT SETTINGS
    // --------------------------------------------------
    const readSettings = await request(
        "/user-settings",
        {
            headers: authHeaders
        }
    );

    assert(
        readSettings.status === 200,
        `Settings READ failed: ${JSON.stringify(readSettings.data)}`
    );

    const originalSettings = readSettings.data.settings;

    assert(
        originalSettings?.user_id === admin.id,
        "Returned settings do not belong to authenticated user."
    );

    console.log("SETTINGS READ: PASS");

    // --------------------------------------------------
    // 4. UPDATE SETTINGS
    // --------------------------------------------------
    const updatedValues = {
        theme:
            originalSettings.theme === "dark"
                ? "light"
                : "dark",

        notifications_enabled:
            !originalSettings.notifications_enabled,

        email_notifications:
            !originalSettings.email_notifications,

        language: "en",

        compact_mode:
            !originalSettings.compact_mode
    };

    const updateSettings = await request(
        "/user-settings",
        {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify(updatedValues)
        }
    );

    assert(
        updateSettings.status === 200,
        `Settings UPDATE failed: ${JSON.stringify(updateSettings.data)}`
    );

    console.log("SETTINGS UPDATE: PASS");

    // --------------------------------------------------
    // 5. VERIFY UPDATE PERSISTED
    // --------------------------------------------------
    const verifySettings = await request(
        "/user-settings",
        {
            headers: authHeaders
        }
    );

    assert(
        verifySettings.status === 200,
        "Could not retrieve updated settings."
    );

    const savedSettings = verifySettings.data.settings;

    assert(
        savedSettings.theme === updatedValues.theme,
        "Theme update did not persist."
    );

    assert(
        savedSettings.notifications_enabled ===
            updatedValues.notifications_enabled,
        "Notifications setting update did not persist."
    );

    assert(
        savedSettings.email_notifications ===
            updatedValues.email_notifications,
        "Email notification setting update did not persist."
    );

    assert(
        savedSettings.language === updatedValues.language,
        "Language update did not persist."
    );

    assert(
        savedSettings.compact_mode ===
            updatedValues.compact_mode,
        "Compact mode update did not persist."
    );

    console.log("SETTINGS UPDATE PERSISTENCE: PASS");

    // --------------------------------------------------
    // 6. INVALID INPUT
    // --------------------------------------------------
    const invalidSettings = await request(
        "/user-settings",
        {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({
                theme: "invalid-theme",
                notifications_enabled: "yes",
                email_notifications: "true",
                language: "invalid-language",
                compact_mode: "enabled"
            })
        }
    );

    assert(
        invalidSettings.status >= 400 &&
        invalidSettings.status < 500,
        "Invalid settings input was not rejected."
    );

    console.log("INVALID SETTINGS INPUT: PASS");

    // --------------------------------------------------
    // 7. RESTORE ORIGINAL SETTINGS
    // --------------------------------------------------
    const restoreSettings = await request(
        "/user-settings",
        {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({
                theme: originalSettings.theme,
                notifications_enabled:
                    originalSettings.notifications_enabled,
                email_notifications:
                    originalSettings.email_notifications,
                language: originalSettings.language,
                compact_mode: originalSettings.compact_mode
            })
        }
    );

    assert(
        restoreSettings.status === 200,
        `Could not restore original settings: ${JSON.stringify(
            restoreSettings.data
        )}`
    );

    console.log("SETTINGS RESTORE: PASS");

    // --------------------------------------------------
    // 8. VERIFY RESTORE
    // --------------------------------------------------
    const finalSettings = await request(
        "/user-settings",
        {
            headers: authHeaders
        }
    );

    assert(
        finalSettings.status === 200,
        "Could not retrieve restored settings."
    );

    const restored = finalSettings.data.settings;

    assert(
        restored.theme === originalSettings.theme &&
        restored.notifications_enabled ===
            originalSettings.notifications_enabled &&
        restored.email_notifications ===
            originalSettings.email_notifications &&
        restored.language === originalSettings.language &&
        restored.compact_mode ===
            originalSettings.compact_mode,
        "Original settings were not fully restored."
    );

    console.log("SETTINGS RESTORE VERIFICATION: PASS");

    console.log(
        "\nUSER SETTINGS API TEST: ALL PASSED\n"
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
require("dotenv").config();

const supabase = require("./config/supabase");
const pool = require("./config/database");

const seedPassword = process.env.SEED_USER_PASSWORD;

if (!seedPassword || seedPassword.length < 12) {
    throw new Error(
        "Set SEED_USER_PASSWORD in backend/.env to a strong demo password of at least 12 characters."
    );
}

const demoUsers = [
    { email: "admin.demo@example.com", displayName: "Demo Administrator", role: "administrator" },
    { email: "developer1.demo@example.com", displayName: "Aiden Jacobs", role: "developer" },
    { email: "developer2.demo@example.com", displayName: "Mia Daniels", role: "developer" },
    { email: "developer3.demo@example.com", displayName: "Noah Petersen", role: "developer" },
    { email: "developer4.demo@example.com", displayName: "Leila Adams", role: "developer" },
    { email: "finance1.demo@example.com", displayName: "Samantha Williams", role: "finance_manager" },
    { email: "finance2.demo@example.com", displayName: "Thabo Ndlovu", role: "finance_manager" },
    { email: "client1.demo@example.com", displayName: "Amara Jacobs", role: "client" },
    { email: "client2.demo@example.com", displayName: "Ethan Smith", role: "client" },
    { email: "client3.demo@example.com", displayName: "Zanele Mokoena", role: "client" }
];

const clientIds = Array.from({ length: 10 }, (_, i) =>
    `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const projectIds = Array.from({ length: 10 }, (_, i) =>
    `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const milestoneIds = Array.from({ length: 10 }, (_, i) =>
    `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const documentIds = Array.from({ length: 10 }, (_, i) =>
    `40000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const invoiceIds = Array.from({ length: 10 }, (_, i) =>
    `50000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const paymentIds = Array.from({ length: 10 }, (_, i) =>
    `60000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const notificationIds = Array.from({ length: 10 }, (_, i) =>
    `70000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`
);

const clients = [
    ["Cape Town Digital Studio", "Amara Jacobs", "amara.jacobs@example.com", "+27 21 555 0101", "Cape Town, Western Cape", "Website and digital platform client", "active"],
    ["Horizon Legal Services", "Ethan Smith", "ethan.smith@example.com", "+27 21 555 0102", "Bellville, Western Cape", "Client portal and document workflow", "active"],
    ["GreenPoint Wellness", "Zanele Mokoena", "zanele.mokoena@example.com", "+27 21 555 0103", "Green Point, Cape Town", "Booking and service website", "active"],
    ["Atlantic Property Group", "Lerato Dlamini", "lerato.dlamini@example.com", "+27 21 555 0104", "Sea Point, Cape Town", "Property listing platform", "active"],
    ["Ubuntu Education Hub", "Michael Adams", "michael.adams@example.com", "+27 21 555 0105", "Woodstock, Cape Town", "Learning management portal", "active"],
    ["Peninsula Logistics", "Farah Khan", "farah.khan@example.com", "+27 21 555 0106", "Epping, Cape Town", "Operations tracking dashboard", "active"],
    ["Mountain View Architects", "Daniel Petersen", "daniel.petersen@example.com", "+27 21 555 0107", "Durbanville, Cape Town", "Portfolio and enquiry website", "active"],
    ["Coastal Retail Co", "Nandi Cele", "nandi.cele@example.com", "+27 21 555 0108", "Milnerton, Cape Town", "Catalogue and stock portal", "active"],
    ["NextWave Consulting", "Imran Davids", "imran.davids@example.com", "+27 21 555 0109", "Century City, Cape Town", "Client and project workflow", "active"],
    ["Southern Tech Solutions", "Olivia Daniels", "olivia.daniels@example.com", "+27 21 555 0110", "Claremont, Cape Town", "Internal service desk", "inactive"]
];

const projects = [
    ["PRJ-2026-001", "Corporate Website Refresh", "Redesign and rebuild the corporate website.", "in_progress", "high", "2026-08-01", "2026-11-15", 45000, 0],
    ["PRJ-2026-002", "Client Document Portal", "Secure document exchange and status tracking.", "in_progress", "urgent", "2026-07-15", "2026-10-30", 68000, 1],
    ["PRJ-2026-003", "Wellness Booking Platform", "Online appointment booking and reminders.", "planned", "medium", "2026-10-20", "2027-01-31", 52000, 2],
    ["PRJ-2026-004", "Property Listings Dashboard", "Searchable property listings and enquiry dashboard.", "on_hold", "medium", "2026-06-01", "2026-12-10", 73000, 3],
    ["PRJ-2026-005", "Education Portal", "Student resources and course administration portal.", "in_progress", "high", "2026-08-10", "2026-12-05", 85000, 0],
    ["PRJ-2026-006", "Logistics Tracking Dashboard", "Operations overview and delivery status tracking.", "completed", "high", "2026-04-01", "2026-09-30", 61000, 1],
    ["PRJ-2026-007", "Architect Portfolio Website", "Responsive portfolio and enquiry form.", "completed", "low", "2026-03-10", "2026-06-30", 28000, 2],
    ["PRJ-2026-008", "Retail Product Catalogue", "Product catalogue and stock availability interface.", "in_progress", "medium", "2026-09-01", "2026-12-20", 49000, 3],
    ["PRJ-2026-009", "Consulting Workflow System", "Internal client and project workflow improvements.", "planned", "medium", "2026-11-01", "2027-02-28", 56000, 0],
    ["PRJ-2026-010", "Service Desk MVP", "Initial ticketing and support workflow.", "in_progress", "urgent", "2026-08-20", "2026-11-20", 64000, 1]
];

const milestones = [
    ["Requirements approved", "Scope and requirements signed off.", "2026-08-10", "completed", 1],
    ["Portal wireframes approved", "Confirm document portal layouts.", "2026-09-15", "completed", 2],
    ["Booking flow prototype", "Prototype appointment selection and confirmation.", "2026-11-05", "in_progress", 3],
    ["Property search module", "Implement core search and filters.", "2026-10-30", "blocked", 4],
    ["Course dashboard", "Build the student course dashboard.", "2026-11-10", "in_progress", 1],
    ["Tracking QA sign-off", "Complete acceptance checks for tracking dashboard.", "2026-09-25", "completed", 2],
    ["Portfolio content handover", "Receive final images and project descriptions.", "2026-06-15", "completed", 3],
    ["Catalogue data import", "Import and validate initial product catalogue.", "2026-10-25", "pending", 4],
    ["Workflow review", "Review proposed workflow with stakeholders.", "2026-12-01", "pending", 1],
    ["Service desk pilot", "Run pilot with a small internal user group.", "2026-11-10", "in_progress", 2]
];

const documents = [
    ["Requirements-Specification.pdf", "projects/PRJ-2026-001/requirements-specification.pdf", "application/pdf", 245760, "Approved requirements specification.", "client", 0],
    ["Portal-Wireframes.pdf", "projects/PRJ-2026-002/portal-wireframes.pdf", "application/pdf", 512000, "Portal wireframes for review.", "client", 1],
    ["Booking-Flow.png", "projects/PRJ-2026-003/booking-flow.png", "image/png", 183400, "Appointment booking flow preview.", "client", 2],
    ["Property-Search-Notes.docx", "projects/PRJ-2026-004/property-search-notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 97280, "Search and filtering requirements.", "internal", 3],
    ["Course-Portal-Plan.pdf", "projects/PRJ-2026-005/course-portal-plan.pdf", "application/pdf", 302100, "Course portal implementation plan.", "client", 0],
    ["Tracking-QA-Report.pdf", "projects/PRJ-2026-006/tracking-qa-report.pdf", "application/pdf", 187500, "QA results for the completed tracking dashboard.", "internal", 1],
    ["Portfolio-Content.docx", "projects/PRJ-2026-007/portfolio-content.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 110000, "Final portfolio copy.", "client", 2],
    ["Product-Import-Template.xlsx", "projects/PRJ-2026-008/product-import-template.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 76500, "Template for catalogue import.", "internal", 3],
    ["Workflow-Draft.pdf", "projects/PRJ-2026-009/workflow-draft.pdf", "application/pdf", 210400, "Draft workflow design.", "client", 0],
    ["Service-Desk-Test-Plan.pdf", "projects/PRJ-2026-010/service-desk-test-plan.pdf", "application/pdf", 134000, "Initial service desk test plan.", "internal", 1]
];

const invoices = [
    ["INV-2026-001", 0, "2026-08-01", "2026-08-31", 10000, 1500, "partially_paid", "Website refresh initial milestone."],
    ["INV-2026-002", 1, "2026-08-15", "2026-09-14", 12000, 1800, "paid", "Client portal discovery phase."],
    ["INV-2026-003", 2, "2026-09-01", "2026-10-01", 8000, 1200, "partially_paid", "Booking platform design phase."],
    ["INV-2026-004", 3, "2026-07-01", "2026-07-31", 15000, 2250, "overdue", "Property dashboard development."],
    ["INV-2026-005", 4, "2026-08-20", "2026-09-19", 18000, 2700, "paid", "Education portal implementation."],
    ["INV-2026-006", 5, "2026-06-01", "2026-06-30", 14000, 2100, "paid", "Logistics dashboard delivery."],
    ["INV-2026-007", 6, "2026-05-01", "2026-05-31", 7000, 1050, "paid", "Architect portfolio development."],
    ["INV-2026-008", 7, "2026-09-10", "2026-10-10", 9000, 1350, "partially_paid", "Retail catalogue first phase."],
    ["INV-2026-009", 8, "2026-10-01", "2026-10-31", 11000, 1650, "sent", "Consulting workflow discovery."],
    ["INV-2026-010", 9, "2026-09-15", "2026-10-15", 13000, 1950, "partially_paid", "Service desk MVP sprint one."]
];

const payments = [
    ["INV-2026-002", 13800, "2026-09-10", "eft", "PAY-2026-002", "completed", "Paid in full."],
    ["INV-2026-003", 5000, "2026-09-25", "eft", "PAY-2026-003", "completed", "Part payment received."],
    ["INV-2026-005", 20700, "2026-09-15", "card", "PAY-2026-005", "completed", "Paid in full."],
    ["INV-2026-006", 16100, "2026-06-28", "eft", "PAY-2026-006", "completed", "Paid in full."],
    ["INV-2026-007", 8050, "2026-05-29", "eft", "PAY-2026-007", "completed", "Paid in full."],
    ["INV-2026-001", 5000, "2026-08-20", "eft", "PAY-2026-001", "completed", "Deposit received."],
    ["INV-2026-004", 2500, "2026-08-05", "eft", "PAY-2026-004", "completed", "Partial payment; balance outstanding."],
    ["INV-2026-008", 3000, "2026-09-28", "card", "PAY-2026-008", "completed", "Deposit received."],
    ["INV-2026-010", 4000, "2026-10-01", "eft", "PAY-2026-010", "completed", "Deposit received."],
    ["INV-2026-009", 2000, "2026-10-05", "other", "PAY-2026-009", "pending", "Pending payment reconciliation."]
];

const notifications = [
    ["Project update: website refresh", "The corporate website refresh reached the content review stage.", "project_update", false, 0],
    ["Milestone completed", "Portal wireframes have been approved.", "milestone", false, 1],
    ["Booking prototype in progress", "The booking flow prototype is being developed.", "project_update", false, 2],
    ["Property project on hold", "The property search module is blocked pending content.", "system", false, 3],
    ["Course dashboard update", "The course dashboard implementation is underway.", "project_update", false, 4],
    ["Invoice payment received", "Payment for INV-2026-006 has been recorded.", "payment", true, 5],
    ["Portfolio completed", "The architect portfolio project has been completed.", "project_update", true, 6],
    ["Catalogue import due soon", "The product catalogue import milestone is approaching.", "milestone", false, 7],
    ["Invoice awaiting review", "Invoice INV-2026-009 is ready for finance review.", "invoice", false, 8],
    ["Service desk pilot scheduled", "The service desk pilot is scheduled for November.", "info", false, 9]
];

async function ensureDemoUsers() {
    const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (error) throw error;

    const usersByEmail = new Map(
        (data.users || []).map((user) => [user.email?.toLowerCase(), user])
    );

    const result = new Map();

    for (const demoUser of demoUsers) {
        let user = usersByEmail.get(demoUser.email.toLowerCase());

        if (!user) {
            const { data: created, error: createError } =
                await supabase.auth.admin.createUser({
                    email: demoUser.email,
                    password: seedPassword,
                    email_confirm: true,
                    user_metadata: { display_name: demoUser.displayName }
                });

            if (createError) throw createError;
            user = created.user;
            console.log(`Created demo auth user: ${demoUser.email}`);
        } else {
            console.log(`Reusing demo auth user: ${demoUser.email}`);
        }

        if (!user?.id) {
            throw new Error(`Could not resolve Auth user ID for ${demoUser.email}`);
        }

        await pool.query(
            `INSERT INTO public.profiles (id, display_name, email, role, is_active)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT (id) DO UPDATE
             SET display_name = EXCLUDED.display_name,
                 email = EXCLUDED.email,
                 role = EXCLUDED.role,
                 is_active = true`,
            [user.id, demoUser.displayName, demoUser.email, demoUser.role]
        );

        result.set(demoUser.email, user.id);
    }

    return result;
}

async function seedBusinessData(profileIds) {
    const adminId = profileIds.get("admin.demo@example.com");

    const developerIds = [
        profileIds.get("developer1.demo@example.com"),
        profileIds.get("developer2.demo@example.com"),
        profileIds.get("developer3.demo@example.com"),
        profileIds.get("developer4.demo@example.com")
    ];

    const financeIds = [
        profileIds.get("finance1.demo@example.com"),
        profileIds.get("finance2.demo@example.com")
    ];

    const clientProfileIds = [
        profileIds.get("client1.demo@example.com"),
        profileIds.get("client2.demo@example.com"),
        profileIds.get("client3.demo@example.com")
    ];

    await pool.query("BEGIN");

    try {
        for (let i = 0; i < clients.length; i++) {
            const c = clients[i];

            const profileId =
                i < clientProfileIds.length ? clientProfileIds[i] : null;

            await pool.query(
                `INSERT INTO public.clients
                    (id, profile_id, company_name, contact_name, email, phone,
                     address, notes, status, created_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                 ON CONFLICT (id) DO UPDATE SET
                    profile_id = EXCLUDED.profile_id,
                    company_name = EXCLUDED.company_name,
                    contact_name = EXCLUDED.contact_name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    address = EXCLUDED.address,
                    notes = EXCLUDED.notes,
                    status = EXCLUDED.status,
                    created_by = EXCLUDED.created_by`,
                [clientIds[i], profileId, ...c, adminId]
            );
        }

        for (let i = 0; i < projects.length; i++) {
            const p = projects[i];

            await pool.query(
                `INSERT INTO public.projects
                    (id, client_id, project_code, name, description, status, priority,
                     start_date, due_date, budget, assigned_developer_id, created_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                 ON CONFLICT (id) DO UPDATE SET
                    client_id = EXCLUDED.client_id,
                    project_code = EXCLUDED.project_code,
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    status = EXCLUDED.status,
                    priority = EXCLUDED.priority,
                    start_date = EXCLUDED.start_date,
                    due_date = EXCLUDED.due_date,
                    budget = EXCLUDED.budget,
                    assigned_developer_id = EXCLUDED.assigned_developer_id,
                    created_by = EXCLUDED.created_by`,
                [
                    projectIds[i],
                    clientIds[i],
                    p[0],
                    p[1],
                    p[2],
                    p[3],
                    p[4],
                    p[5],
                    p[6],
                    p[7],
                    developerIds[p[8]],
                    adminId
                ]
            );
        }

        for (let i = 0; i < milestones.length; i++) {
            const m = milestones[i];
            const completedAt = m[3] === "completed" ? m[2] : null;

            await pool.query(
                `INSERT INTO public.milestones
                    (id, project_id, title, description, due_date, status, assigned_to, completed_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT (id) DO UPDATE SET
                    project_id = EXCLUDED.project_id,
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    due_date = EXCLUDED.due_date,
                    status = EXCLUDED.status,
                    assigned_to = EXCLUDED.assigned_to,
                    completed_at = EXCLUDED.completed_at`,
                [
                    milestoneIds[i],
                    projectIds[i],
                    m[0],
                    m[1],
                    m[2],
                    m[3],
                    developerIds[(m[4] - 1) % developerIds.length],
                    completedAt
                ]
            );
        }

        for (let i = 0; i < documents.length; i++) {
            const d = documents[i];

            await pool.query(
                `INSERT INTO public.documents
                    (id, project_id, file_name, storage_path, mime_type, size_bytes,
                     description, visibility, uploaded_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (id) DO UPDATE SET
                    project_id = EXCLUDED.project_id,
                    file_name = EXCLUDED.file_name,
                    storage_path = EXCLUDED.storage_path,
                    mime_type = EXCLUDED.mime_type,
                    size_bytes = EXCLUDED.size_bytes,
                    description = EXCLUDED.description,
                    visibility = EXCLUDED.visibility,
                    uploaded_by = EXCLUDED.uploaded_by`,
                [
                    documentIds[i],
                    projectIds[i],
                    d[0],
                    d[1],
                    d[2],
                    d[3],
                    d[4],
                    d[5],
                    developerIds[d[6]]
                ]
            );
        }

        for (let i = 0; i < invoices.length; i++) {
            const inv = invoices[i];

            await pool.query(
                `INSERT INTO public.invoices
                    (id, invoice_number, client_id, project_id, issue_date, due_date,
                     subtotal, tax_amount, currency, status, notes, created_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ZAR',$9,$10,$11)
                 ON CONFLICT (id) DO UPDATE SET
                    invoice_number = EXCLUDED.invoice_number,
                    client_id = EXCLUDED.client_id,
                    project_id = EXCLUDED.project_id,
                    issue_date = EXCLUDED.issue_date,
                    due_date = EXCLUDED.due_date,
                    subtotal = EXCLUDED.subtotal,
                    tax_amount = EXCLUDED.tax_amount,
                    currency = EXCLUDED.currency,
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes,
                    created_by = EXCLUDED.created_by`,
                [
                    invoiceIds[i],
                    inv[0],
                    clientIds[inv[1]],
                    projectIds[inv[1]],
                    inv[2],
                    inv[3],
                    inv[4],
                    inv[5],
                    inv[6],
                    inv[7],
                    financeIds[i % financeIds.length]
                ]
            );
        }

        for (let i = 0; i < payments.length; i++) {
            const pay = payments[i];
            const invoiceIndex = invoices.findIndex((inv) => inv[0] === pay[0]);

            await pool.query(
                `INSERT INTO public.payments
                    (id, invoice_id, amount, payment_date, method, reference, status, notes, recorded_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (id) DO UPDATE SET
                    invoice_id = EXCLUDED.invoice_id,
                    amount = EXCLUDED.amount,
                    payment_date = EXCLUDED.payment_date,
                    method = EXCLUDED.method,
                    reference = EXCLUDED.reference,
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes,
                    recorded_by = EXCLUDED.recorded_by`,
                [
                    paymentIds[i],
                    invoiceIds[invoiceIndex],
                    pay[1],
                    pay[2],
                    pay[3],
                    pay[4],
                    pay[5],
                    pay[6],
                    financeIds[i % financeIds.length]
                ]
            );
        }

        for (let i = 0; i < notifications.length; i++) {
            const n = notifications[i];
            const userEmail = demoUsers[n[4]].email;
            const userId = profileIds.get(userEmail);
            const relatedProjectId = projectIds[i];
            const readAt = n[3] ? "2026-10-01T10:00:00Z" : null;

            await pool.query(
                `INSERT INTO public.notifications
                    (id, user_id, title, message, type, is_read, read_at, related_project_id)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    title = EXCLUDED.title,
                    message = EXCLUDED.message,
                    type = EXCLUDED.type,
                    is_read = EXCLUDED.is_read,
                    read_at = EXCLUDED.read_at,
                    related_project_id = EXCLUDED.related_project_id`,
                [
                    notificationIds[i],
                    userId,
                    n[0],
                    n[1],
                    n[2],
                    n[3],
                    readAt,
                    relatedProjectId
                ]
            );
        }

        const settingValues = [
            ["dark", true, true, "en", false],
            ["system", true, true, "en", false],
            ["light", true, false, "en", true],
            ["dark", false, false, "en", false],
            ["system", true, true, "en", true],
            ["light", true, true, "en", false],
            ["dark", true, false, "en", true],
            ["system", true, true, "en", false],
            ["light", false, true, "en", false],
            ["dark", true, true, "en", true]
        ];

        for (let i = 0; i < demoUsers.length; i++) {
            const userId = profileIds.get(demoUsers[i].email);
            const s = settingValues[i];

            await pool.query(
                `INSERT INTO public.user_settings
                    (user_id, theme, notifications_enabled, email_notifications, language, compact_mode)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (user_id) DO UPDATE SET
                    theme = EXCLUDED.theme,
                    notifications_enabled = EXCLUDED.notifications_enabled,
                    email_notifications = EXCLUDED.email_notifications,
                    language = EXCLUDED.language,
                    compact_mode = EXCLUDED.compact_mode`,
                [userId, s[0], s[1], s[2], s[3], s[4]]
            );
        }

        await pool.query("COMMIT");
    } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
    }
}

async function verifyCounts() {
    const tables = [
        "profiles",
        "clients",
        "projects",
        "milestones",
        "documents",
        "invoices",
        "payments",
        "notifications",
        "user_settings"
    ];

    console.log("\nRecord counts after seeding:");

    let failed = false;

    for (const table of tables) {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS count FROM public.${table}`
        );

        const count = result.rows[0].count;

        console.log(`${table.padEnd(18)} ${count}`);

        if (count < 10) {
            failed = true;
        }
    }

    if (failed) {
        throw new Error("At least one required table has fewer than 10 records.");
    }
}

async function main() {
    try {
        console.log("Creating/reusing demo authentication users...");

        const profileIds = await ensureDemoUsers();

        console.log("Seeding relational business data...");

        await seedBusinessData(profileIds);

        await verifyCounts();

        console.log("\nSeed completed. Demo user passwords are read from backend/.env.");
        console.log("Document rows contain metadata only; actual files have not been uploaded to Storage.");
    } catch (error) {
        console.error("\nSeed failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
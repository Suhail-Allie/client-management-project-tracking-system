const CMS_API_BASE_URL = "https://client-management-api-14cs.onrender.com/api/v1";

function getCmsAccessToken() {
    return sessionStorage.getItem("cms_access_token");
}

async function cmsApiRequest(endpoint, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getCmsAccessToken();

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${CMS_API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.success === false) {
        if (response.status === 401) {
            sessionStorage.removeItem("cms_access_token");
            sessionStorage.removeItem("cms_profile");
        }
        throw new Error(payload.message || `Request failed with HTTP ${response.status}.`);
    }

    return payload;
}


document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginMessage = document.getElementById("login-message");
    const submitButton = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        loginMessage.className = "login-message";
        loginMessage.textContent = "";

        if (!email || !password) {
            loginMessage.textContent = "Please enter your email address and password.";
            loginMessage.classList.add("error");
            return;
        }

        if (submitButton) submitButton.disabled = true;
        loginMessage.textContent = "Signing in...";

        try {
            const response = await fetch(`${CMS_API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok || !payload.success || !payload.session?.access_token) {
                throw new Error(payload.message || "Unable to sign in. Check your credentials.");
            }

            sessionStorage.setItem("cms_access_token", payload.session.access_token);
            sessionStorage.setItem("cms_profile", JSON.stringify(payload.profile || payload.user || {}));
            loginMessage.textContent = "Login successful. Opening dashboard...";
            loginMessage.classList.add("success");
            window.location.href = "pages/dashboard.html";
        } catch (error) {
            loginMessage.textContent = error.message || "Unable to sign in. Please try again.";
            loginMessage.classList.add("error");
            if (submitButton) submitButton.disabled = false;
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {

    const menuButton =
        document.getElementById("mobile-menu-button");

    const sidebar =
        document.querySelector(".sidebar");

    if (!menuButton || !sidebar) {
        return;
    }

    menuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

});



document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".logout-link").forEach((link) => {
        link.addEventListener("click", async (event) => {
            event.preventDefault();
            const token = getCmsAccessToken();
            const destination = link.href;
            try {
                if (token) {
                    await fetch(`${CMS_API_BASE_URL}/auth/logout`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } catch (_) {
                // Clear the local session even if the API cannot be reached.
            } finally {
                sessionStorage.removeItem("cms_access_token");
                sessionStorage.removeItem("cms_profile");
                window.location.href = destination;
            }
        });
    });
});


document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("client-search");

    const statusFilter =
        document.getElementById("client-status-filter");

    const tableBody =
        document.getElementById("client-table-body");

    const emptyMessage =
        document.getElementById("client-empty-message");

    if (!searchInput || !statusFilter || !tableBody) {
        return;
    }


    function filterClients() {

        const searchTerm =
            searchInput.value.toLowerCase().trim();

        const selectedStatus =
            statusFilter.value;

        const rows =
            tableBody.querySelectorAll("tr");

        let visibleRows = 0;

        rows.forEach((row) => {

            const rowText =
                row.textContent.toLowerCase();

            const rowStatus =
                row.dataset.status;

            const matchesSearch =
                rowText.includes(searchTerm);

            const matchesStatus =
                selectedStatus === "all" ||
                rowStatus === selectedStatus;

            if (matchesSearch && matchesStatus) {
                row.style.display = "";
                visibleRows++;
            } else {
                row.style.display = "none";
            }

        });

        if (emptyMessage) {
            emptyMessage.style.display =
                visibleRows === 0 ? "block" : "none";
        }

    }


    searchInput.addEventListener(
        "input",
        filterClients
    );

    statusFilter.addEventListener(
        "change",
        filterClients
    );

});


document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("client-modal");

    const openButton =
        document.getElementById("open-client-modal");

    const closeButton =
        document.getElementById("close-client-modal");

    const cancelButton =
        document.getElementById("cancel-client-modal");

    const form =
        document.getElementById("add-client-form");

    const tableBody =
        document.getElementById("client-table-body");

    if (!modal || !openButton || !form || !tableBody) {
        return;
    }


    function openModal() {
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    }


    function closeModal() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        form.reset();
    }


    openButton.addEventListener(
        "click",
        openModal
    );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeModal
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            closeModal();
        }

    });


    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const name =
            document
                .getElementById("new-client-name")
                .value
                .trim();

        const company =
            document
                .getElementById("new-client-company")
                .value
                .trim();

        const email =
            document
                .getElementById("new-client-email")
                .value
                .trim();

        const phone =
            document
                .getElementById("new-client-phone")
                .value
                .trim();

        const status =
            document
                .getElementById("new-client-status")
                .value;

        const currentRows =
            tableBody.querySelectorAll("tr").length;

        const clientId =
            "CL" +
            String(currentRows + 1).padStart(3, "0");

        const today =
            new Date().toISOString().split("T")[0];

        const statusText =
            status === "active"
                ? "Active"
                : "Inactive";

        const newRow =
            document.createElement("tr");

        newRow.dataset.status = status;

        newRow.innerHTML = `
            <td>${clientId}</td>
            <td>${name}</td>
            <td>${company}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td>${today}</td>
            <td>
                <span class="status-badge ${status}">
                    ${statusText}
                </span>
            </td>
            <td>
                <a
                    href="client-details.html"
                    class="table-action view"
                >
                    View
                </a>
            </td>
        `;

        tableBody.appendChild(newRow);

        closeModal();

    });

});




document.addEventListener("DOMContentLoaded", () => {

    const clientName =
        document.getElementById("client-name");

    if (!clientName) {
        return;
    }


    const clients = {

        CL001: {
            name: "John Anderson",
            company: "TechCorp Inc.",
            email: "john@techcorp.com",
            phone: "+27 82 123 4567",
            registrationDate: "2025-01-15",
            status: "active",
            activeProjects: "3",
            totalProjects: "5",
            balance: "R8,500",
            clientSince: "Jan 2025"
        },

        CL002: {
            name: "Sarah Williams",
            company: "Digital Solutions Ltd.",
            email: "sarah@digitalsolutions.com",
            phone: "+27 83 234 5678",
            registrationDate: "2025-02-21",
            status: "active",
            activeProjects: "2",
            totalProjects: "4",
            balance: "R3,200",
            clientSince: "Feb 2025"
        },

        CL003: {
            name: "Michael Chen",
            company: "Innovatech Labs",
            email: "michael@innovatetech.com",
            phone: "+27 84 345 6789",
            registrationDate: "2025-03-10",
            status: "active",
            activeProjects: "4",
            totalProjects: "6",
            balance: "R12,000",
            clientSince: "Mar 2025"
        },

        CL004: {
            name: "Emily Davis",
            company: "StartupHub",
            email: "emily@startuphub.com",
            phone: "+27 85 456 7890",
            registrationDate: "2024-12-05",
            status: "inactive",
            activeProjects: "0",
            totalProjects: "2",
            balance: "R0",
            clientSince: "Dec 2024"
        }

    };


    const parameters =
        new URLSearchParams(window.location.search);

    const clientId =
        parameters.get("id") || "CL001";

    const client =
        clients[clientId] || clients.CL001;


    const initials =
        client.name
            .split(" ")
            .map((name) => name.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase();


    document.getElementById("client-avatar").textContent =
        initials;

    document.getElementById("client-name").textContent =
        client.name;

    document.getElementById("client-company").textContent =
        client.company;

    document.getElementById("client-company-detail").textContent =
        client.company;

    document.getElementById("client-id").textContent =
        `Client ID: ${clientId}`;

    document.getElementById("client-email").textContent =
        client.email;

    document.getElementById("client-phone").textContent =
        client.phone;

    document.getElementById(
        "client-registration-date"
    ).textContent = client.registrationDate;

    document.getElementById(
        "client-project-count"
    ).textContent = client.activeProjects;

    document.getElementById(
        "client-total-projects"
    ).textContent = client.totalProjects;

    document.getElementById(
        "client-balance"
    ).textContent = client.balance;

    document.getElementById(
        "client-since"
    ).textContent = client.clientSince;


    const statusBadge =
        document.getElementById("client-status");

    const accountStatus =
        document.getElementById("client-account-status");

    const statusText =
        client.status === "active"
            ? "Active"
            : "Inactive";

    statusBadge.textContent =
        statusText;

    statusBadge.className =
        `status-badge ${client.status}`;

    accountStatus.textContent =
        statusText;


    /* ===============================================
       EDIT CLIENT MODAL
    =============================================== */

    const modal =
        document.getElementById("edit-client-modal");

    const openButton =
        document.getElementById("open-edit-client-modal");

    const closeButton =
        document.getElementById("close-edit-client-modal");

    const cancelButton =
        document.getElementById("cancel-edit-client-modal");

    const form =
        document.getElementById("edit-client-form");


    function openEditModal() {

        document.getElementById(
            "edit-client-name"
        ).value = client.name;

        document.getElementById(
            "edit-client-company"
        ).value = client.company;

        document.getElementById(
            "edit-client-email"
        ).value = client.email;

        document.getElementById(
            "edit-client-phone"
        ).value = client.phone;

        document.getElementById(
            "edit-client-status"
        ).value = client.status;

        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeEditModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    openButton.addEventListener(
        "click",
        openEditModal
    );


    closeButton.addEventListener(
        "click",
        closeEditModal
    );


    cancelButton.addEventListener(
        "click",
        closeEditModal
    );


    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            closeEditModal();
        }

    });


    form.addEventListener("submit", (event) => {

        event.preventDefault();


        const updatedName =
            document.getElementById(
                "edit-client-name"
            ).value.trim();

        const updatedCompany =
            document.getElementById(
                "edit-client-company"
            ).value.trim();

        const updatedEmail =
            document.getElementById(
                "edit-client-email"
            ).value.trim();

        const updatedPhone =
            document.getElementById(
                "edit-client-phone"
            ).value.trim();

        const updatedStatus =
            document.getElementById(
                "edit-client-status"
            ).value;


        document.getElementById(
            "client-name"
        ).textContent = updatedName;

        document.getElementById(
            "client-company"
        ).textContent = updatedCompany;

        document.getElementById(
            "client-company-detail"
        ).textContent = updatedCompany;

        document.getElementById(
            "client-email"
        ).textContent = updatedEmail;

        document.getElementById(
            "client-phone"
        ).textContent = updatedPhone;


        const newInitials =
            updatedName
                .split(" ")
                .map((name) => name.charAt(0))
                .join("")
                .substring(0, 2)
                .toUpperCase();

        document.getElementById(
            "client-avatar"
        ).textContent = newInitials;


        const updatedStatusText =
            updatedStatus === "active"
                ? "Active"
                : "Inactive";

        statusBadge.textContent =
            updatedStatusText;

        statusBadge.className =
            `status-badge ${updatedStatus}`;

        accountStatus.textContent =
            updatedStatusText;


        closeEditModal();

    });

});





document.addEventListener("DOMContentLoaded", () => {

    const projectSearch =
        document.getElementById("project-search");

    const projectFilter =
        document.getElementById("project-status-filter");

    const projectGrid =
        document.getElementById("project-grid");

    const emptyMessage =
        document.getElementById("project-empty-message");


    if (!projectSearch || !projectFilter || !projectGrid) {
        return;
    }


    function filterProjects() {

        const searchValue =
            projectSearch.value
                .toLowerCase()
                .trim();

        const statusValue =
            projectFilter.value;

        const projectCards =
            projectGrid.querySelectorAll(".project-card");

        let visibleProjects = 0;


        projectCards.forEach((card) => {

            const cardText =
                card.textContent.toLowerCase();

            const cardStatus =
                card.dataset.status;

            const matchesSearch =
                cardText.includes(searchValue);

            const matchesStatus =
                statusValue === "all" ||
                statusValue === cardStatus;


            if (matchesSearch && matchesStatus) {

                card.style.display = "";

                visibleProjects++;

            } else {

                card.style.display = "none";

            }

        });


        if (emptyMessage) {

            emptyMessage.style.display =
                visibleProjects === 0
                    ? "block"
                    : "none";

        }

    }


    projectSearch.addEventListener(
        "input",
        filterProjects
    );


    projectFilter.addEventListener(
        "change",
        filterProjects
    );

});


/* =========================================================
   CREATE PROJECT MODAL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("project-modal");

    const openButton =
        document.getElementById("open-project-modal");

    const closeButton =
        document.getElementById("close-project-modal");

    const cancelButton =
        document.getElementById("cancel-project-modal");

    const form =
        document.getElementById("create-project-form");

    const projectGrid =
        document.getElementById("project-grid");


    if (!modal || !openButton || !form || !projectGrid) {
        return;
    }


    function openProjectModal() {

        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeProjectModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        form.reset();

    }


    openButton.addEventListener(
        "click",
        openProjectModal
    );


    closeButton.addEventListener(
        "click",
        closeProjectModal
    );


    cancelButton.addEventListener(
        "click",
        closeProjectModal
    );


    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            closeProjectModal();
        }

    });


    form.addEventListener("submit", (event) => {

        event.preventDefault();


        const name =
            document
                .getElementById("project-name")
                .value
                .trim();

        const client =
            document
                .getElementById("project-client")
                .value;

        const developer =
            document
                .getElementById("project-developer")
                .value
                .trim();

        const budget =
            document
                .getElementById("project-budget")
                .value;

        const startDate =
            document
                .getElementById("project-start-date")
                .value;

        const endDate =
            document
                .getElementById("project-end-date")
                .value;

        const status =
            document
                .getElementById("project-status")
                .value;


        const projectCount =
            projectGrid.querySelectorAll(
                ".project-card"
            ).length;

        const projectId =
            "PR" +
            String(projectCount + 1)
                .padStart(3, "0");


        let statusLabel = "Planning";

        let progress = 10;


        if (status === "in-progress") {

            statusLabel = "In Progress";

            progress = 40;

        }


        if (status === "completed") {

            statusLabel = "Completed";

            progress = 100;

        }


        const formattedBudget =
            Number(budget).toLocaleString(
                "en-ZA"
            );


        const projectCard =
            document.createElement("article");


        projectCard.className =
            "project-card";

        projectCard.dataset.status =
            status;


        projectCard.innerHTML = `
            <div class="project-card-top">

                <div>
                    <h2>${name}</h2>
                    <p>${client}</p>
                </div>

                <span class="project-status ${status}">
                    ${statusLabel}
                </span>

            </div>

            <div class="project-info-list">

                <div>
                    <span>Developer</span>
                    <strong>${developer}</strong>
                </div>

                <div>
                    <span>Budget</span>
                    <strong>R${formattedBudget}</strong>
                </div>

                <div>
                    <span>Timeline</span>
                    <strong>
                        ${startDate} - ${endDate}
                    </strong>
                </div>

            </div>

            <div class="project-progress">

                <div class="project-progress-header">
                    <span>Completion</span>
                    <strong>${progress}%</strong>
                </div>

                <div class="project-progress-track">
                    <span style="width: ${progress}%;"></span>
                </div>

            </div>

            <div class="project-card-actions">

                <a
                    href="project-details.html?id=${projectId}"
                    class="project-action view"
                >
                    View
                </a>

                <button
                    class="project-action edit"
                    type="button"
                >
                    Edit
                </button>

                <button
                    class="project-action delete"
                    type="button"
                >
                    Delete
                </button>

            </div>
        `;


        projectGrid.appendChild(
            projectCard
        );


        closeProjectModal();

    });

});





/* =========================================================
   PROJECT DETAILS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const projectName =
        document.getElementById("project-detail-name");


    if (!projectName) {
        return;
    }


    /* =====================================================
       SAMPLE PROJECT DATA
    ====================================================== */

    const projects = {

        PR001: {

            name: "E-commerce Platform",

            client: "TechCorp Inc.",

            developer: "Mike Developer",

            budget: 45000,

            startDate: "2026-06-15",

            deadline: "2026-09-15",

            progress: 65,

            status: "in-progress",

            description:
                "Development of a responsive e-commerce platform that allows customers to browse products, manage their shopping cart and complete online orders."

        },


        PR002: {

            name: "Mobile App Development",

            client: "Digital Solutions Ltd.",

            developer: "Sarah Developer",

            budget: 52000,

            startDate: "2026-06-21",

            deadline: "2026-09-30",

            progress: 40,

            status: "in-progress",

            description:
                "Development of a mobile application that provides users with convenient access to the organisation's services and important account information."

        },


        PR003: {

            name: "CRM System",

            client: "Innovatech Labs",

            developer: "Mike Developer",

            budget: 38500,

            startDate: "2026-03-01",

            deadline: "2026-08-20",

            progress: 100,

            status: "completed",

            description:
                "Development of a customer relationship management system used to organise client information, communication and important business activities."

        },


        PR004: {

            name: "Website Redesign",

            client: "StartupHub",

            developer: "Emily Developer",

            budget: 18500,

            startDate: "2026-09-01",

            deadline: "2026-10-05",

            progress: 10,

            status: "planning",

            description:
                "Redesign of the existing company website to improve usability, responsiveness, navigation and overall presentation."

        }

    };


    /* =====================================================
       GET PROJECT ID FROM URL
    ====================================================== */

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    const projectId =
        parameters.get("id") || "PR001";


    const project =
        projects[projectId] ||
        projects.PR001;


    /* =====================================================
       STATUS LABEL
    ====================================================== */

    function getStatusLabel(status) {

        if (status === "completed") {
            return "Completed";
        }

        if (status === "in-progress") {
            return "In Progress";
        }

        return "Planning";

    }


    /* =====================================================
       DATE DISPLAY
    ====================================================== */

    function formatDisplayDate(dateValue) {

        const date =
            new Date(
                `${dateValue}T00:00:00`
            );


        return date.toLocaleDateString(
            "en-ZA",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       PROJECT DURATION
    ====================================================== */

    function calculateDuration(
        startDate,
        deadline
    ) {

        const start =
            new Date(startDate);

        const end =
            new Date(deadline);

        const difference =
            end - start;

        const days =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );

        return `${days} Days`;

    }


    /* =====================================================
       DISPLAY PROJECT
    ====================================================== */

    function displayProject() {

        const formattedBudget =
            `R${Number(project.budget)
                .toLocaleString("en-ZA")}`;


        const statusLabel =
            getStatusLabel(
                project.status
            );


        document.getElementById(
            "project-detail-name"
        ).textContent =
            project.name;


        document.getElementById(
            "project-detail-client"
        ).textContent =
            project.client;


        document.getElementById(
            "project-detail-id"
        ).textContent =
            `Project ID: ${projectId}`;


        document.getElementById(
            "project-detail-budget"
        ).textContent =
            formattedBudget;


        document.getElementById(
            "project-detail-developer"
        ).textContent =
            project.developer;


        document.getElementById(
            "project-detail-start-date"
        ).textContent =
            formatDisplayDate(
                project.startDate
            );


        document.getElementById(
            "project-detail-deadline"
        ).textContent =
            formatDisplayDate(
                project.deadline
            );


        document.getElementById(
            "project-detail-percentage"
        ).textContent =
            `${project.progress}%`;


        document.getElementById(
            "project-detail-progress-bar"
        ).style.width =
            `${project.progress}%`;


        document.getElementById(
            "project-info-client"
        ).textContent =
            project.client;


        document.getElementById(
            "project-info-developer"
        ).textContent =
            project.developer;


        document.getElementById(
            "project-info-status"
        ).textContent =
            statusLabel;


        document.getElementById(
            "project-info-budget"
        ).textContent =
            formattedBudget;


        document.getElementById(
            "project-info-start-date"
        ).textContent =
            project.startDate;


        document.getElementById(
            "project-info-deadline"
        ).textContent =
            project.deadline;


        document.getElementById(
            "project-info-duration"
        ).textContent =
            calculateDuration(
                project.startDate,
                project.deadline
            );


        document.getElementById(
            "project-description"
        ).textContent =
            project.description;


        const statusBadge =
            document.getElementById(
                "project-detail-status"
            );


        statusBadge.textContent =
            statusLabel;


        statusBadge.className =
            `project-status ${project.status}`;

    }


    displayProject();


    /* =====================================================
       EDIT PROJECT MODAL
    ====================================================== */

    const modal =
        document.getElementById(
            "edit-project-modal"
        );


    const openButton =
        document.getElementById(
            "open-edit-project-modal"
        );


    const closeButton =
        document.getElementById(
            "close-edit-project-modal"
        );


    const cancelButton =
        document.getElementById(
            "cancel-edit-project-modal"
        );


    const form =
        document.getElementById(
            "edit-project-form"
        );


    function openEditProjectModal() {

        document.getElementById(
            "edit-project-name"
        ).value =
            project.name;


        document.getElementById(
            "edit-project-client"
        ).value =
            project.client;


        document.getElementById(
            "edit-project-developer"
        ).value =
            project.developer;


        document.getElementById(
            "edit-project-budget"
        ).value =
            project.budget;


        document.getElementById(
            "edit-project-start-date"
        ).value =
            project.startDate;


        document.getElementById(
            "edit-project-deadline"
        ).value =
            project.deadline;


        document.getElementById(
            "edit-project-progress"
        ).value =
            project.progress;


        document.getElementById(
            "edit-project-status"
        ).value =
            project.status;


        modal.classList.add(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeEditProjectModal() {

        modal.classList.remove(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    openButton.addEventListener(
        "click",
        openEditProjectModal
    );


    closeButton.addEventListener(
        "click",
        closeEditProjectModal
    );


    cancelButton.addEventListener(
        "click",
        closeEditProjectModal
    );


    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {

                closeEditProjectModal();

            }

        }
    );


    /* =====================================================
       SAVE FRONTEND CHANGES
    ====================================================== */

    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            project.name =
                document.getElementById(
                    "edit-project-name"
                ).value.trim();


            project.client =
                document.getElementById(
                    "edit-project-client"
                ).value.trim();


            project.developer =
                document.getElementById(
                    "edit-project-developer"
                ).value.trim();


            project.budget =
                Number(
                    document.getElementById(
                        "edit-project-budget"
                    ).value
                );


            project.startDate =
                document.getElementById(
                    "edit-project-start-date"
                ).value;


            project.deadline =
                document.getElementById(
                    "edit-project-deadline"
                ).value;


            project.progress =
                Number(
                    document.getElementById(
                        "edit-project-progress"
                    ).value
                );


            project.status =
                document.getElementById(
                    "edit-project-status"
                ).value;


            displayProject();


            closeEditProjectModal();

        }
    );

});









/* =========================================================
   MILESTONE MANAGEMENT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("milestone-modal");

    const openButton =
        document.getElementById("open-milestone-modal");

    const closeButton =
        document.getElementById("close-milestone-modal");

    const cancelButton =
        document.getElementById("cancel-milestone-modal");

    const form =
        document.getElementById("add-milestone-form");


    if (!modal || !openButton || !form) {
        return;
    }


    function openMilestoneModal() {

        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeMilestoneModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        form.reset();

        document.getElementById(
            "milestone-progress"
        ).value = "0";

    }


    openButton.addEventListener(
        "click",
        openMilestoneModal
    );


    closeButton.addEventListener(
        "click",
        closeMilestoneModal
    );


    cancelButton.addEventListener(
        "click",
        closeMilestoneModal
    );


    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {
                closeMilestoneModal();
            }

        }
    );


    function updateMilestoneCounts() {

        const pending =
            document
                .getElementById("pending-milestones")
                .querySelectorAll(".milestone-card")
                .length;


        const progress =
            document
                .getElementById("progress-milestones")
                .querySelectorAll(".milestone-card")
                .length;


        const completed =
            document
                .getElementById("completed-milestones")
                .querySelectorAll(".milestone-card")
                .length;


        document.getElementById(
            "pending-count"
        ).textContent = pending;


        document.getElementById(
            "progress-count"
        ).textContent = progress;


        document.getElementById(
            "completed-count"
        ).textContent = completed;

    }


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const name =
                document
                    .getElementById("milestone-name")
                    .value
                    .trim();


            const project =
                document
                    .getElementById("milestone-project")
                    .value;


            const status =
                document
                    .getElementById("milestone-status")
                    .value;


            const progress =
                Number(
                    document
                        .getElementById("milestone-progress")
                        .value
                );


            const dueDate =
                document
                    .getElementById("milestone-due-date")
                    .value;


            const description =
                document
                    .getElementById("milestone-description")
                    .value
                    .trim();


            let destination =
                document.getElementById(
                    "pending-milestones"
                );


            let statusClass =
                "planning";


            let statusLabel =
                "Pending";


            if (status === "in-progress") {

                destination =
                    document.getElementById(
                        "progress-milestones"
                    );

                statusClass =
                    "in-progress";

                statusLabel =
                    "In Progress";

            }


            if (status === "completed") {

                destination =
                    document.getElementById(
                        "completed-milestones"
                    );

                statusClass =
                    "completed";

                statusLabel =
                    "Completed";

            }


            const card =
                document.createElement("article");


            card.className =
                "milestone-card";


            const completedClass =
                status === "completed"
                    ? " completed"
                    : "";


            card.innerHTML = `
                <div class="milestone-card-header">

                    <h3>${name}</h3>

                    <span class="project-status ${statusClass}">
                        ${statusLabel}
                    </span>

                </div>

                <p class="milestone-project-name">
                    ${project}
                </p>

                <p class="milestone-description">
                    ${description}
                </p>

                <div class="milestone-progress-row">

                    <span>Progress</span>

                    <strong>${progress}%</strong>

                </div>

                <div class="milestone-progress-track${completedClass}">

                    <span style="width: ${progress}%;"></span>

                </div>

                <div class="milestone-due-date">
                    Due: ${dueDate}
                </div>
            `;


            destination.appendChild(card);


            updateMilestoneCounts();


            closeMilestoneModal();

        }
    );

});





/* =========================================================
   DOCUMENT MANAGEMENT — REAL API + SUPABASE STORAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const browseButton = document.getElementById("browse-files-button");
    const fileInput = document.getElementById("document-file-input");
    const dropZone = document.getElementById("document-drop-zone");
    const tableBody = document.getElementById("document-table-body");
    const uploadMessage = document.getElementById("upload-message");
    const searchInput = document.getElementById("document-search");
    const emptyMessage = document.getElementById("document-empty-message");
    const projectSelect = document.getElementById("document-project-select");
    const visibilitySelect = document.getElementById("document-visibility-select");
    const descriptionInput = document.getElementById("document-description-input");
    const uploadPanel = document.querySelector(".document-upload-panel");

    if (!browseButton || !fileInput || !dropZone || !tableBody) return;

    const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "zip", "png", "jpg", "jpeg"];
    const mimeTypes = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        zip: "application/zip",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg"
    };

    let profile = {};
    try {
        profile = JSON.parse(sessionStorage.getItem("cms_profile") || "{}");
    } catch (_) {}
    const canManageDocuments = profile.role === "administrator" || profile.role === "developer";

    function setUploadMessage(message, type = "") {
        if (!uploadMessage) return;
        uploadMessage.className = "upload-message";
        uploadMessage.textContent = message;
        if (type) uploadMessage.classList.add(type);
    }

    function getFileExtension(fileName) {
        const parts = fileName.split(".");
        return parts.length > 1 ? parts.pop().toLowerCase() : "";
    }

    function formatFileSize(bytes) {
        const size = Number(bytes);
        if (!Number.isFinite(size) || size <= 0) return "—";
        return size < 1024 * 1024
            ? `${(size / 1024).toFixed(1)} KB`
            : `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    function formatDate(value) {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toISOString().split("T")[0];
    }

    function createCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value == null || value === "" ? "—" : String(value);
        return cell;
    }

    function renderDocumentRow(record) {
        const row = document.createElement("tr");
        row.dataset.documentId = record.id;
        row.appendChild(createCell(`DOC-${String(record.id || "").slice(0, 8).toUpperCase()}`));

        const nameCell = document.createElement("td");
        const nameWrapper = document.createElement("div");
        nameWrapper.className = "document-name-cell";
        const icon = document.createElement("span");
        icon.className = "document-file-icon";
        icon.textContent = getFileExtension(record.file_name).toUpperCase() || "FILE";
        const name = document.createElement("span");
        name.textContent = record.file_name || "Unnamed document";
        nameWrapper.append(icon, name);
        nameCell.appendChild(nameWrapper);
        row.appendChild(nameCell);

        row.appendChild(createCell(record.project_name || record.project_code || "—"));
        row.appendChild(createCell(getFileExtension(record.file_name).toUpperCase() || "FILE"));
        row.appendChild(createCell(formatFileSize(record.size_bytes)));
        row.appendChild(createCell(formatDate(record.created_at)));
        row.appendChild(createCell(record.uploaded_by_name || "—"));

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "document-actions";
        // Seed records are metadata-only; actual uploads use project UUID as the first path segment.
        const hasStoredFile = typeof record.storage_path === "string" &&
            record.storage_path.startsWith(`${record.project_id}/`);

        const downloadButton = document.createElement("button");
        downloadButton.className = "document-action download";
        downloadButton.type = "button";
        downloadButton.dataset.action = "download";
        downloadButton.textContent = hasStoredFile ? "Download" : "No file stored";
        downloadButton.disabled = !hasStoredFile;
        downloadButton.title = hasStoredFile
            ? "Download this file"
            : "This older record contains metadata only; no file is stored.";
        actions.appendChild(downloadButton);

        if (canManageDocuments) {
            const deleteButton = document.createElement("button");
            deleteButton.className = "document-action delete";
            deleteButton.type = "button";
            deleteButton.dataset.action = "delete";
            deleteButton.textContent = "Delete";
            actions.appendChild(deleteButton);
        }

        actionsCell.appendChild(actions);
        row.appendChild(actionsCell);
        return row;
    }

    function applyDocumentSearch() {
        if (!searchInput) return;
        const searchValue = searchInput.value.toLowerCase().trim();
        const rows = Array.from(tableBody.querySelectorAll("tr"));
        let visibleRows = 0;
        rows.forEach((row) => {
            const matches = row.textContent.toLowerCase().includes(searchValue);
            row.style.display = matches ? "" : "none";
            if (matches) visibleRows++;
        });
        if (emptyMessage) emptyMessage.style.display = visibleRows === 0 ? "block" : "none";
    }

    async function loadProjects() {
        if (!projectSelect) return;
        const payload = await cmsApiRequest("/projects");
        const projects =
            (Array.isArray(payload.projects) && payload.projects) ||
            (Array.isArray(payload.data?.projects) && payload.data.projects) ||
            (Array.isArray(payload.data) && payload.data) || [];
        projectSelect.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = projects.length ? "Choose a project..." : "No projects available";
        projectSelect.appendChild(placeholder);
        projects.forEach((project) => {
            if (!project.id) return;
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = `${project.project_code || "Project"} — ${project.name || "Unnamed project"}`;
            projectSelect.appendChild(option);
        });
    }

    async function loadDocuments() {
        tableBody.replaceChildren();
        const payload = await cmsApiRequest("/documents");
        const records = Array.isArray(payload.documents) ? payload.documents : [];
        records.forEach((record) => tableBody.appendChild(renderDocumentRow(record)));
        applyDocumentSearch();
    }

    async function uploadFile(file) {
        const extension = getFileExtension(file.name);
        if (!allowedExtensions.includes(extension)) throw new Error(`${file.name}: unsupported file type.`);
        if (file.size <= 0) throw new Error(`${file.name}: the file is empty.`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: maximum file size is 10 MB.`);
        if (!projectSelect?.value) throw new Error("Choose a project before uploading files.");

        const query = new URLSearchParams({
            project_id: projectSelect.value,
            file_name: file.name,
            visibility: visibilitySelect?.value || "internal",
            description: descriptionInput?.value.trim() || ""
        });
        const payload = await cmsApiRequest(`/documents/upload?${query.toString()}`, {
            method: "POST",
            headers: { "Content-Type": file.type || mimeTypes[extension] },
            body: file
        });
        if (payload.document) {
            const existingRow = tableBody.querySelector(`[data-document-id="${payload.document.id}"]`);
            if (!existingRow) tableBody.prepend(renderDocumentRow(payload.document));
        }
    }

    async function handleFiles(files) {
        if (!files.length) return;
        if (!getCmsAccessToken()) {
            setUploadMessage("Your session has expired. Please sign in again.", "error");
            return;
        }
        if (!canManageDocuments) {
            setUploadMessage("Only administrators and assigned developers can upload documents.", "error");
            return;
        }

        setUploadMessage("Uploading file(s) to secure storage...");
        browseButton.disabled = true;
        fileInput.disabled = true;
        const failures = [];
        let succeeded = 0;

        try {
            for (const file of files) {
                try {
                    await uploadFile(file);
                    succeeded++;
                } catch (error) {
                    failures.push(error.message || `${file.name}: upload failed.`);
                }
            }
            if (succeeded > 0) {
                setUploadMessage(succeeded === 1
                    ? "File uploaded to secure storage successfully."
                    : `${succeeded} files uploaded to secure storage successfully.`, "success");
            }
            if (failures.length > 0) {
                setUploadMessage([
                    succeeded > 0 ? `${succeeded} upload(s) succeeded.` : "",
                    ...failures
                ].filter(Boolean).join(" "), "error");
            }
            await loadDocuments();
        } catch (error) {
            setUploadMessage(error.message || "Unable to upload the selected file(s).", "error");
        } finally {
            browseButton.disabled = false;
            fileInput.disabled = false;
        }
    }

    browseButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        handleFiles(Array.from(fileInput.files || []));
        fileInput.value = "";
    });
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.classList.add("drag-active");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-active"));
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("drag-active");
        handleFiles(Array.from(event.dataTransfer?.files || []));
    });
    if (searchInput) searchInput.addEventListener("input", applyDocumentSearch);

    tableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const row = button.closest("tr");
        const documentId = row?.dataset.documentId;
        if (!documentId) return;

        if (button.dataset.action === "download") {
            button.disabled = true;
            try {
                const payload = await cmsApiRequest(`/documents/${encodeURIComponent(documentId)}/download`);
                if (!payload.download_url) throw new Error("The download link was not returned.");
                const link = document.createElement("a");
                link.href = payload.download_url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.click();
            } catch (error) {
                setUploadMessage(error.message || "Unable to download this document.", "error");
            } finally {
                button.disabled = false;
            }
        }

        if (button.dataset.action === "delete") {
            if (!canManageDocuments) {
                setUploadMessage("You do not have permission to delete documents.", "error");
                return;
            }
            if (!window.confirm("Delete this document and its stored file?")) return;
            button.disabled = true;
            try {
                await cmsApiRequest(`/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
                row.remove();
                applyDocumentSearch();
                setUploadMessage("Document deleted successfully.", "success");
            } catch (error) {
                setUploadMessage(error.message || "Unable to delete this document.", "error");
                button.disabled = false;
            }
        }
    });

    if (!getCmsAccessToken()) {
        if (uploadPanel) uploadPanel.hidden = true;
        setUploadMessage("Please sign in to view and manage documents.", "error");
        window.setTimeout(() => { window.location.href = "../index.html"; }, 1200);
        return;
    }

    if (!canManageDocuments && uploadPanel) uploadPanel.hidden = true;

    Promise.all([loadProjects(), loadDocuments()])
        .then(() => {
            if (!canManageDocuments) {
                setUploadMessage("You have read-only access to documents visible to your account.");
            }
        })
        .catch((error) => {
            setUploadMessage(error.message || "Unable to load documents. Please sign in again.", "error");
        });
});


/* =========================================================
   INVOICE SEARCH AND FILTER
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("invoice-search");

    const statusFilter =
        document.getElementById("invoice-status-filter");

    const tableBody =
        document.getElementById("invoice-table-body");

    const emptyMessage =
        document.getElementById("invoice-empty-message");


    if (!searchInput || !statusFilter || !tableBody) {
        return;
    }


    function filterInvoices() {

        const searchValue =
            searchInput.value
                .toLowerCase()
                .trim();


        const selectedStatus =
            statusFilter.value;


        const rows =
            tableBody.querySelectorAll("tr");


        let visibleRows = 0;


        rows.forEach((row) => {

            const rowText =
                row.textContent.toLowerCase();


            const rowStatus =
                row.dataset.status;


            const matchesSearch =
                rowText.includes(searchValue);


            const matchesStatus =
                selectedStatus === "all" ||
                selectedStatus === rowStatus;


            if (matchesSearch && matchesStatus) {

                row.style.display = "";

                visibleRows++;

            } else {

                row.style.display = "none";

            }

        });


        if (emptyMessage) {

            emptyMessage.style.display =
                visibleRows === 0
                    ? "block"
                    : "none";

        }

    }


    searchInput.addEventListener(
        "input",
        filterInvoices
    );


    statusFilter.addEventListener(
        "change",
        filterInvoices
    );

});




/* =========================================================
   GENERATE INVOICE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("invoice-modal");

    const openButton =
        document.getElementById("open-invoice-modal");

    const closeButton =
        document.getElementById("close-invoice-modal");

    const cancelButton =
        document.getElementById("cancel-invoice-modal");

    const form =
        document.getElementById("generate-invoice-form");

    const tableBody =
        document.getElementById("invoice-table-body");


    if (!modal || !openButton || !form || !tableBody) {
        return;
    }


    function openInvoiceModal() {

        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeInvoiceModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        form.reset();

    }


    openButton.addEventListener(
        "click",
        openInvoiceModal
    );


    closeButton.addEventListener(
        "click",
        closeInvoiceModal
    );


    cancelButton.addEventListener(
        "click",
        closeInvoiceModal
    );


    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {
                closeInvoiceModal();
            }

        }
    );


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const client =
                document
                    .getElementById("invoice-client")
                    .value;


            const project =
                document
                    .getElementById("invoice-project")
                    .value;


            const amount =
                Number(
                    document
                        .getElementById("invoice-amount")
                        .value
                );


            const issueDate =
                document
                    .getElementById("invoice-issue-date")
                    .value;


            const dueDate =
                document
                    .getElementById("invoice-due-date")
                    .value;


            const status =
                document
                    .getElementById("invoice-status")
                    .value;


            const rowCount =
                tableBody.querySelectorAll("tr").length;


            const invoiceId =
                `INV-${1001 + rowCount}`;


            let statusLabel =
                "Pending";


            if (status === "paid") {
                statusLabel = "Paid";
            }


            if (status === "overdue") {
                statusLabel = "Overdue";
            }


            const formattedAmount =
                Number(amount).toLocaleString(
                    "en-ZA",
                    {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                    }
                );


            const row =
                document.createElement("tr");


            row.dataset.status =
                status;


            row.innerHTML = `
                <td>${invoiceId}</td>

                <td>${client}</td>

                <td>${project}</td>

                <td>R${formattedAmount}</td>

                <td>${issueDate}</td>

                <td>${dueDate}</td>

                <td>
                    <span class="invoice-status ${status}">
                        ${statusLabel}
                    </span>
                </td>

                <td>
                    <button
                        class="invoice-action view"
                        type="button"
                    >
                        View
                    </button>
                </td>
            `;


            tableBody.appendChild(row);


            closeInvoiceModal();

        }
    );

});





/* =========================================================
   VIEW INVOICE DETAILS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const tableBody =
        document.getElementById("invoice-table-body");

    const modal =
        document.getElementById("invoice-view-modal");

    const closeButton =
        document.getElementById("close-invoice-view-modal");


    if (!tableBody || !modal || !closeButton) {
        return;
    }


    tableBody.addEventListener(
        "click",
        (event) => {

            const viewButton =
                event.target.closest(
                    ".invoice-action.view"
                );


            if (!viewButton) {
                return;
            }


            const row =
                viewButton.closest("tr");


            const cells =
                row.querySelectorAll("td");


            document.getElementById(
                "view-invoice-id"
            ).textContent =
                cells[0].textContent.trim();


            document.getElementById(
                "view-invoice-client"
            ).textContent =
                cells[1].textContent.trim();


            document.getElementById(
                "view-invoice-project"
            ).textContent =
                cells[2].textContent.trim();


            document.getElementById(
                "view-invoice-amount"
            ).textContent =
                cells[3].textContent.trim();


            document.getElementById(
                "view-invoice-issue"
            ).textContent =
                cells[4].textContent.trim();


            document.getElementById(
                "view-invoice-due"
            ).textContent =
                cells[5].textContent.trim();


            document.getElementById(
                "view-invoice-status"
            ).textContent =
                cells[6].textContent.trim();


            modal.classList.add("open");


            modal.setAttribute(
                "aria-hidden",
                "false"
            );

        }
    );


    function closeViewModal() {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    closeButton.addEventListener(
        "click",
        closeViewModal
    );


    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {
                closeViewModal();
            }

        }
    );

});



/* =========================================================
   REPORTS & ANALYTICS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const reportType =
        document.getElementById("report-type");

    const reportPeriod =
        document.getElementById("report-period");

    const generateButton =
        document.getElementById("generate-report-button");

    const reportTitle =
        document.getElementById("current-report-title");


    if (
        !reportType ||
        !reportPeriod ||
        !generateButton ||
        !reportTitle
    ) {
        return;
    }


    const reportNames = {

        financial:
            "Financial Report",

        projects:
            "Project Progress Report",

        clients:
            "Client Activity Report",

        milestones:
            "Milestone Performance Report"

    };


    const periodNames = {

        "3":
            "Last 3 Months",

        "6":
            "Last 6 Months",

        "12":
            "Last 12 Months",

        year:
            "Current Year"

    };


    generateButton.addEventListener(
        "click",
        () => {

            const selectedReport =
                reportNames[
                    reportType.value
                ];


            const selectedPeriod =
                periodNames[
                    reportPeriod.value
                ];


            reportTitle.textContent =
                `${selectedReport} - ${selectedPeriod}`;

        }
    );

});



/* =========================================================
   EXPORT REPORT AS PDF
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const pdfButton =
        document.getElementById("export-pdf-button");


    if (!pdfButton) {
        return;
    }


    pdfButton.addEventListener(
        "click",
        () => {

            window.print();

        }
    );

});





/* =========================================================
   EXPORT REPORT FOR EXCEL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const excelButton =
        document.getElementById("export-excel-button");


    if (!excelButton) {
        return;
    }


    excelButton.addEventListener(
        "click",
        () => {

            const reportType =
                document.getElementById(
                    "report-type"
                ).selectedOptions[0].text;


            const reportPeriod =
                document.getElementById(
                    "report-period"
                ).selectedOptions[0].text;


            const revenue =
                document.getElementById(
                    "report-revenue"
                ).textContent.trim();


            const projects =
                document.getElementById(
                    "report-projects"
                ).textContent.trim();


            const clients =
                document.getElementById(
                    "report-clients"
                ).textContent.trim();


            const completion =
                document.getElementById(
                    "report-completion"
                ).textContent.trim();


            const csvRows = [

                [
                    "Web App Solutions",
                    "Reports & Analytics"
                ],

                [
                    "Report Type",
                    reportType
                ],

                [
                    "Date Range",
                    reportPeriod
                ],

                [],

                [
                    "Metric",
                    "Value"
                ],

                [
                    "Total Revenue",
                    revenue
                ],

                [
                    "Total Projects",
                    projects
                ],

                [
                    "Active Clients",
                    clients
                ],

                [
                    "Completion Rate",
                    completion
                ],

                [],

                [
                    "Report Summary",
                    "Value"
                ],

                [
                    "Total Projects Completed",
                    "156"
                ],

                [
                    "Active Projects",
                    "32"
                ],

                [
                    "Total Clients",
                    "55"
                ],

                [
                    "Average Project Duration",
                    "4.2 months"
                ],

                [
                    "Client Satisfaction Rate",
                    "94.2%"
                ],

                [
                    "On-Time Delivery Rate",
                    "87.5%"
                ]

            ];


            const csvContent =
                csvRows
                    .map(
                        (row) =>
                            row
                                .map(
                                    (value) =>
                                        `"${String(value)
                                            .replaceAll(
                                                '"',
                                                '""'
                                            )}"`
                                )
                                .join(",")
                    )
                    .join("\n");


            const blob =
                new Blob(
                    [csvContent],
                    {
                        type:
                            "text/csv;charset=utf-8;"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "web-app-solutions-report.csv";


            document.body.appendChild(
                link
            );


            link.click();


            document.body.removeChild(
                link
            );


            URL.revokeObjectURL(
                url
            );

        }
    );

});







/* =========================================================
   NOTIFICATION MANAGEMENT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const notificationList =
        document.getElementById(
            "notification-list"
        );

    const emptyState =
        document.getElementById(
            "notification-empty-state"
        );

    const markAllButton =
        document.getElementById(
            "mark-all-read-button"
        );

    const deleteAllButton =
        document.getElementById(
            "delete-all-notifications-button"
        );

    const filterButtons =
        document.querySelectorAll(
            ".notification-filter"
        );

    const allCount =
        document.getElementById(
            "all-notification-count"
        );

    const unreadCount =
        document.getElementById(
            "unread-notification-count"
        );


    if (
        !notificationList ||
        !markAllButton ||
        !deleteAllButton
    ) {
        return;
    }


    let currentFilter =
        "all";


    /* =====================================================
       UPDATE COUNTS
    ====================================================== */

    function updateNotificationCounts() {

        const notifications =
            notificationList.querySelectorAll(
                ".notification-card"
            );


        const unreadNotifications =
            notificationList.querySelectorAll(
                '.notification-card[data-read="false"]'
            );


        allCount.textContent =
            notifications.length;


        unreadCount.textContent =
            unreadNotifications.length;


        if (
            notifications.length === 0
        ) {

            emptyState.style.display =
                "block";

            notificationList.style.display =
                "none";

        } else {

            emptyState.style.display =
                "none";

            notificationList.style.display =
                "flex";

        }

    }


    /* =====================================================
       FILTER NOTIFICATIONS
    ====================================================== */

    function filterNotifications() {

        const notifications =
            notificationList.querySelectorAll(
                ".notification-card"
            );


        let visibleNotifications =
            0;


        notifications.forEach(
            (notification) => {

                const isRead =
                    notification.dataset.read ===
                    "true";


                let shouldShow =
                    true;


                if (
                    currentFilter === "unread"
                ) {

                    shouldShow =
                        !isRead;

                }


                notification.style.display =
                    shouldShow
                        ? ""
                        : "none";


                if (shouldShow) {

                    visibleNotifications++;

                }

            }
        );


        if (
            visibleNotifications === 0
        ) {

            emptyState.style.display =
                "block";

            notificationList.style.display =
                "flex";

        } else {

            emptyState.style.display =
                "none";

        }

    }


    /* =====================================================
       FILTER BUTTONS
    ====================================================== */

    filterButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    filterButtons.forEach(
                        (item) => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter;


                    filterNotifications();

                }
            );

        }
    );


    /* =====================================================
       INDIVIDUAL ACTIONS
    ====================================================== */

    notificationList.addEventListener(
        "click",
        (event) => {

            const markReadButton =
                event.target.closest(
                    ".notification-action.mark-read"
                );


            const deleteButton =
                event.target.closest(
                    ".notification-action.delete"
                );


            /* MARK ONE AS READ */
            if (markReadButton) {

                const card =
                    markReadButton.closest(
                        ".notification-card"
                    );


                card.dataset.read =
                    "true";


                card.classList.remove(
                    "unread"
                );


                const indicator =
                    card.querySelector(
                        ".unread-indicator"
                    );


                if (indicator) {

                    indicator.remove();

                }


                markReadButton.remove();


                updateNotificationCounts();

                filterNotifications();

            }


            /* DELETE ONE */
            if (deleteButton) {

                const card =
                    deleteButton.closest(
                        ".notification-card"
                    );


                card.remove();


                updateNotificationCounts();

                filterNotifications();

            }

        }
    );


    /* =====================================================
       MARK ALL READ
    ====================================================== */

    markAllButton.addEventListener(
        "click",
        () => {

            const notifications =
                notificationList.querySelectorAll(
                    ".notification-card"
                );


            notifications.forEach(
                (card) => {

                    card.dataset.read =
                        "true";


                    card.classList.remove(
                        "unread"
                    );


                    const indicator =
                        card.querySelector(
                            ".unread-indicator"
                        );


                    if (indicator) {

                        indicator.remove();

                    }


                    const markReadButton =
                        card.querySelector(
                            ".notification-action.mark-read"
                        );


                    if (markReadButton) {

                        markReadButton.remove();

                    }

                }
            );


            updateNotificationCounts();

            filterNotifications();

        }
    );


    /* =====================================================
       DELETE ALL
    ====================================================== */

    deleteAllButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Delete all notifications?"
                );


            if (!confirmed) {
                return;
            }


            notificationList.innerHTML =
                "";


            updateNotificationCounts();

        }
    );


    updateNotificationCounts();

});





/* =========================================================
   USER MANAGEMENT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const tableBody =
        document.getElementById("user-table-body");

    const searchInput =
        document.getElementById("user-search");

    const roleFilter =
        document.getElementById("user-role-filter");

    const emptyMessage =
        document.getElementById("user-empty-message");

    const modal =
        document.getElementById("user-modal");

    const openButton =
        document.getElementById("open-user-modal");

    const closeButton =
        document.getElementById("close-user-modal");

    const cancelButton =
        document.getElementById("cancel-user-modal");

    const form =
        document.getElementById("user-form");


    if (
        !tableBody ||
        !searchInput ||
        !roleFilter ||
        !modal ||
        !form
    ) {
        return;
    }


    let editingRow =
        null;


    /* =====================================================
       ROLE LABEL
    ====================================================== */

    function getRoleLabel(role) {

        if (role === "administrator") {
            return "Administrator";
        }

        if (role === "developer") {
            return "Developer";
        }

        if (role === "finance") {
            return "Finance Manager";
        }

        return "Client";

    }


    /* =====================================================
       USER COUNTS
    ====================================================== */

    function updateUserCounts() {

        const rows =
            tableBody.querySelectorAll("tr");


        let administrators =
            0;

        let staff =
            0;

        let clients =
            0;


        rows.forEach((row) => {

            const role =
                row.dataset.role;


            if (role === "administrator") {
                administrators++;
            }


            if (
                role === "developer" ||
                role === "finance"
            ) {
                staff++;
            }


            if (role === "client") {
                clients++;
            }

        });


        document.getElementById(
            "total-users-count"
        ).textContent =
            rows.length;


        document.getElementById(
            "administrator-count"
        ).textContent =
            administrators;


        document.getElementById(
            "staff-users-count"
        ).textContent =
            staff;


        document.getElementById(
            "client-users-count"
        ).textContent =
            clients;

    }


    /* =====================================================
       SEARCH AND FILTER
    ====================================================== */

    function filterUsers() {

        const searchValue =
            searchInput.value
                .toLowerCase()
                .trim();


        const roleValue =
            roleFilter.value;


        const rows =
            tableBody.querySelectorAll("tr");


        let visibleRows =
            0;


        rows.forEach((row) => {

            const rowText =
                row.textContent
                    .toLowerCase();


            const rowRole =
                row.dataset.role;


            const matchesSearch =
                rowText.includes(
                    searchValue
                );


            const matchesRole =
                roleValue === "all" ||
                roleValue === rowRole;


            if (
                matchesSearch &&
                matchesRole
            ) {

                row.style.display = "";

                visibleRows++;

            } else {

                row.style.display =
                    "none";

            }

        });


        if (emptyMessage) {

            emptyMessage.style.display =
                visibleRows === 0
                    ? "block"
                    : "none";

        }

    }


    searchInput.addEventListener(
        "input",
        filterUsers
    );


    roleFilter.addEventListener(
        "change",
        filterUsers
    );


    /* =====================================================
       MODAL
    ====================================================== */

    function openAddUserModal() {

        editingRow =
            null;


        document.getElementById(
            "user-modal-title"
        ).textContent =
            "Add User";


        document.getElementById(
            "user-modal-description"
        ).textContent =
            "Enter the new user's information.";


        document.getElementById(
            "save-user-button"
        ).textContent =
            "Add User";


        form.reset();


        document.getElementById(
            "user-status"
        ).value =
            "active";


        modal.classList.add(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeUserModal() {

        modal.classList.remove(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        form.reset();


        editingRow =
            null;

    }


    openButton.addEventListener(
        "click",
        openAddUserModal
    );


    closeButton.addEventListener(
        "click",
        closeUserModal
    );


    cancelButton.addEventListener(
        "click",
        closeUserModal
    );


    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {

                closeUserModal();

            }

        }
    );


    /* =====================================================
       TABLE ACTIONS
    ====================================================== */

    tableBody.addEventListener(
        "click",
        (event) => {

            const editButton =
                event.target.closest(
                    ".user-action.edit"
                );


            const statusButton =
                event.target.closest(
                    ".user-action.status"
                );


            /* EDIT */
            if (editButton) {

                editingRow =
                    editButton.closest(
                        "tr"
                    );


                const cells =
                    editingRow.querySelectorAll(
                        "td"
                    );


                document.getElementById(
                    "user-name"
                ).value =
                    cells[1]
                        .textContent
                        .trim();


                document.getElementById(
                    "user-email"
                ).value =
                    cells[2]
                        .textContent
                        .trim();


                document.getElementById(
                    "user-role"
                ).value =
                    editingRow.dataset.role;


                document.getElementById(
                    "user-status"
                ).value =
                    editingRow.dataset.status;


                document.getElementById(
                    "user-modal-title"
                ).textContent =
                    "Edit User";


                document.getElementById(
                    "user-modal-description"
                ).textContent =
                    "Update the user's information and role.";


                document.getElementById(
                    "save-user-button"
                ).textContent =
                    "Save Changes";


                modal.classList.add(
                    "open"
                );


                modal.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }


            /* ENABLE / DISABLE */
            if (statusButton) {

                const row =
                    statusButton.closest(
                        "tr"
                    );


                const statusBadge =
                    row.querySelector(
                        ".status-badge"
                    );


                const isActive =
                    row.dataset.status ===
                    "active";


                if (isActive) {

                    row.dataset.status =
                        "inactive";


                    statusBadge.textContent =
                        "Inactive";


                    statusBadge.className =
                        "status-badge inactive";


                    statusButton.textContent =
                        "Enable";

                } else {

                    row.dataset.status =
                        "active";


                    statusBadge.textContent =
                        "Active";


                    statusBadge.className =
                        "status-badge active";


                    statusButton.textContent =
                        "Disable";

                }

            }

        }
    );


    /* =====================================================
       ADD OR UPDATE USER
    ====================================================== */

    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "user-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "user-email"
                ).value.trim();


            const role =
                document.getElementById(
                    "user-role"
                ).value;


            const status =
                document.getElementById(
                    "user-status"
                ).value;


            const roleLabel =
                getRoleLabel(role);


            const statusLabel =
                status === "active"
                    ? "Active"
                    : "Inactive";


            /* UPDATE EXISTING USER */
            if (editingRow) {

                const cells =
                    editingRow.querySelectorAll(
                        "td"
                    );


                cells[1].textContent =
                    name;


                cells[2].textContent =
                    email;


                cells[3].innerHTML =
                    `
                        <span class="role-badge ${role}">
                            ${roleLabel}
                        </span>
                    `;


                cells[4].innerHTML =
                    `
                        <span class="status-badge ${status}">
                            ${statusLabel}
                        </span>
                    `;


                const statusButton =
                    editingRow.querySelector(
                        ".user-action.status"
                    );


                statusButton.textContent =
                    status === "active"
                        ? "Disable"
                        : "Enable";


                editingRow.dataset.role =
                    role;


                editingRow.dataset.status =
                    status;

            } else {

                /* ADD NEW USER */

                const userCount =
                    tableBody.querySelectorAll(
                        "tr"
                    ).length;


                const userId =
                    "USR" +
                    String(
                        userCount + 1
                    ).padStart(
                        3,
                        "0"
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                row.dataset.role =
                    role;


                row.dataset.status =
                    status;


                row.innerHTML = `
                    <td>${userId}</td>

                    <td>${name}</td>

                    <td>${email}</td>

                    <td>
                        <span class="role-badge ${role}">
                            ${roleLabel}
                        </span>
                    </td>

                    <td>
                        <span class="status-badge ${status}">
                            ${statusLabel}
                        </span>
                    </td>

                    <td>

                        <div class="user-actions">

                            <button
                                class="user-action edit"
                                type="button"
                            >
                                Edit
                            </button>

                            <button
                                class="user-action status"
                                type="button"
                            >
                                ${
                                    status === "active"
                                        ? "Disable"
                                        : "Enable"
                                }
                            </button>

                        </div>

                    </td>
                `;


                tableBody.appendChild(
                    row
                );

            }


            updateUserCounts();


            filterUsers();


            closeUserModal();

        }
    );


    updateUserCounts();

});






/* =========================================================
   PROFILE & SETTINGS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const profileForm =
        document.getElementById(
            "profile-settings-form"
        );

    const notificationForm =
        document.getElementById(
            "notification-settings-form"
        );

    const passwordForm =
        document.getElementById(
            "password-settings-form"
        );

    const message =
        document.getElementById(
            "settings-message"
        );


    if (
        !profileForm ||
        !notificationForm ||
        !passwordForm ||
        !message
    ) {
        return;
    }


    function showSettingsMessage(
        text,
        type
    ) {

        message.textContent =
            text;


        message.className =
            `settings-message ${type}`;


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================================
       SAVE PROFILE
    ====================================================== */

    profileForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "profile-full-name"
                ).value.trim();


            const email =
                document.getElementById(
                    "profile-email"
                ).value.trim();


            document.getElementById(
                "profile-display-name"
            ).textContent =
                name;


            const initials =
                name
                    .split(" ")
                    .filter(Boolean)
                    .map(
                        (part) =>
                            part.charAt(0)
                    )
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();


            document.getElementById(
                "profile-avatar"
            ).textContent =
                initials;


            showSettingsMessage(
                `Profile updated successfully for ${email}.`,
                "success"
            );

        }
    );


    /* =====================================================
       SAVE PREFERENCES
    ====================================================== */

    notificationForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            showSettingsMessage(
                "Notification preferences updated successfully.",
                "success"
            );

        }
    );


    /* =====================================================
       CHANGE PASSWORD
    ====================================================== */

    passwordForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const newPassword =
                document.getElementById(
                    "new-password"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirm-password"
                ).value;


            if (
                newPassword !==
                confirmPassword
            ) {

                showSettingsMessage(
                    "The new passwords do not match.",
                    "error"
                );

                return;

            }


            if (
                newPassword.length < 8
            ) {

                showSettingsMessage(
                    "The new password must contain at least 8 characters.",
                    "error"
                );

                return;

            }


            passwordForm.reset();


            showSettingsMessage(
                "Password validation completed successfully. Permanent password updates will be connected during backend development.",
                "success"
            );

        }
    );

});






/* =========================================================
   GLOBAL TOPBAR NAVIGATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const notificationButtons =
        document.querySelectorAll(".notification-button");

    notificationButtons.forEach((button) => {

        button.addEventListener("click", () => {

            window.location.href =
                "notifications.html";

        });

    });


    const globalSearchInputs =
        document.querySelectorAll(
            ".topbar-search input"
        );


    const pageRoutes = {
        dashboard: "dashboard.html",

        client: "clients.html",
        clients: "clients.html",

        project: "projects.html",
        projects: "projects.html",

        milestone: "milestones.html",
        milestones: "milestones.html",

        document: "documents.html",
        documents: "documents.html",
        file: "documents.html",
        files: "documents.html",

        invoice: "invoices.html",
        invoices: "invoices.html",
        payment: "invoices.html",
        payments: "invoices.html",

        report: "reports.html",
        reports: "reports.html",
        analytics: "reports.html",

        notification: "notifications.html",
        notifications: "notifications.html",

        user: "users.html",
        users: "users.html",

        setting: "profile.html",
        settings: "profile.html",
        profile: "profile.html"
    };


    globalSearchInputs.forEach((input) => {

        input.addEventListener(
            "keydown",
            (event) => {

                if (event.key !== "Enter") {
                    return;
                }


                const searchTerm =
                    input.value
                        .toLowerCase()
                        .trim();


                if (searchTerm === "") {
                    return;
                }


                let matchedRoute =
                    null;


                for (
                    const keyword
                    in pageRoutes
                ) {

                    if (
                        searchTerm.includes(
                            keyword
                        )
                    ) {

                        matchedRoute =
                            pageRoutes[keyword];

                        break;

                    }

                }


                if (matchedRoute) {

                    window.location.href =
                        matchedRoute;

                } else {

                    window.alert(
                        "No matching system page was found."
                    );

                }

            }
        );

    });

});


/* =========================================================
   PROJECT CARD EDIT AND DELETE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const projectGrid =
        document.getElementById(
            "project-grid"
        );


    if (!projectGrid) {
        return;
    }


    projectGrid.addEventListener(
        "click",
        (event) => {

            const editButton =
                event.target.closest(
                    ".project-action.edit"
                );


            const deleteButton =
                event.target.closest(
                    ".project-action.delete"
                );


            /* EDIT PROJECT */
            if (editButton) {

                const card =
                    editButton.closest(
                        ".project-card"
                    );


                const viewLink =
                    card.querySelector(
                        ".project-action.view"
                    );


                if (!viewLink) {
                    return;
                }


                const editUrl =
                    new URL(
                        viewLink.href
                    );


                editUrl.searchParams.set(
                    "edit",
                    "true"
                );


                window.location.href =
                    editUrl.toString();

            }


            /* DELETE PROJECT */
            if (deleteButton) {

                const card =
                    deleteButton.closest(
                        ".project-card"
                    );


                const projectName =
                    card.querySelector(
                        "h2"
                    ).textContent.trim();


                const confirmed =
                    window.confirm(
                        `Delete ${projectName}?`
                    );


                if (!confirmed) {
                    return;
                }


                card.remove();

            }

        }
    );

});


/* =========================================================
   AUTOMATICALLY OPEN PROJECT EDIT FORM
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const editButton =
        document.getElementById(
            "open-edit-project-modal"
        );


    if (!editButton) {
        return;
    }


    const parameters =
        new URLSearchParams(
            window.location.search
        );


    if (
        parameters.get("edit") ===
        "true"
    ) {

        editButton.click();

    }

});
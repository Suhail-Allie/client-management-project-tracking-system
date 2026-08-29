document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("login-form");

    if (!loginForm) {
        return;
    }

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginMessage = document.getElementById("login-message");

    loginForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        loginMessage.className = "login-message";
        loginMessage.textContent = "";

        if (email === "" || password === "") {

            loginMessage.textContent =
                "Please enter your email address and password.";

            loginMessage.classList.add("error");

            return;
        }

        window.location.href = "pages/dashboard.html";

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
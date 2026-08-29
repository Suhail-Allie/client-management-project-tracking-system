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
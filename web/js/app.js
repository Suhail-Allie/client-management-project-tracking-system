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
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
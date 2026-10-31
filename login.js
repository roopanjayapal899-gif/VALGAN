
// ======================================
// VOLGAN - LOGIN SYSTEM
// Supabase Authentication
// ======================================

// HTML elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

// Display messages
function showMessage(text, type = "error") {
    message.textContent = text;

    if (type === "success") {
        message.style.color = "green";
    } else {
        message.style.color = "red";
    }
}

// Show / Hide Password
togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
        togglePassword.setAttribute("aria-label", "Hide password");
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
        togglePassword.setAttribute("aria-label", "Show password");
    }
});

// Login Form
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    console.log("Email entered:", email);
console.log("Password length:", password.length);

    // Check Supabase connection
    if (typeof supabaseClient === "undefined") {
        showMessage(
            "Supabase connection failed. Please check supabase.js."
        );
        return;
    }

    // Validate email
    if (!emailInput.checkValidity() || email === "") {
        showMessage("Please enter a valid email address.");
        emailInput.focus();
        return;
    }

    // Validate password
    if (password.length === 0) {
        showMessage("Please enter your password.");
        passwordInput.focus();
        return;
    }

    // Prevent repeated clicks
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        // Sign in using Supabase
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }

        if (!data.session || !data.user) {
            showMessage(
                "Login was unsuccessful. Please try again."
            );
            return;
        }

    showMessage("Login successful! Welcome to VOLGAN.", "success");
        loginButton.disabled = true;
loginButton.textContent = "Redirecting...";

setTimeout(() => {
    window.location.replace("./index.html");
}, 500);

loginButton.disabled = false;
loginButton.textContent = "Login";

// Redirect to Home page
window.location.href = "./index.html";

loginButton.disabled = false;
loginButton.textContent = "Login";

    } catch (error) {
        console.error("VOLGAN login error:", error);

        const errorMessage = (error.message || "").toLowerCase();

        if (
            errorMessage.includes("email not confirmed") ||
            errorMessage.includes("email_not_confirmed")
        ) {
            showMessage(
                "Please verify your email before logging in."
            );
          
        } else if (
    errorMessage.includes("invalid login credentials")
) {
    showMessage(
        "Supabase rejected the email/password. Check the account and password in Authentication → Users."
    );
    }

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});

// Clear message when the user edits the form
loginForm.addEventListener("input", function () {
    message.textContent = "";
});

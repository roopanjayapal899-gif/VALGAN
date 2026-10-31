// ===================================
// VOLGAN - User Registration
// Supabase Authentication
// ===================================

// HTML elements
const signupForm = document.getElementById("signupForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const message = document.getElementById("message");
const termsInput = document.getElementById("terms");
const submitButton = signupForm.querySelector('button[type="submit"]');

// Show message
function showMessage(text, type = "error") {
    message.textContent = text;
    message.style.color = type === "success" ? "green" : "red";
}

// Form submission
signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";

    // Get form values
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Get selected theme
    const selectedTheme = document.querySelector(
        'input[name="theme"]:checked'
    );

    // Check Supabase connection
    if (typeof supabaseClient === "undefined") {
        showMessage("Supabase connection not found. Check supabase.js.");
        return;
    }

    // Validate username
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        showMessage(
            "Username must be 3–20 characters using letters, numbers or underscores."
        );
        usernameInput.focus();
        return;
    }

    // Validate email
    if (!emailInput.checkValidity() || email === "") {
        showMessage("Please enter a valid email address.");
        emailInput.focus();
        return;
    }

    // Validate password
    if (password.length < 8) {
        showMessage("Password must contain at least 8 characters.");
        passwordInput.focus();
        return;
    }

    // Confirm password
    if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        confirmPasswordInput.focus();
        return;
    }

    // Check theme
    if (!selectedTheme) {
        showMessage("Please select your VOLGAN theme.");
        return;
    }

    // Check terms
    if (!termsInput.checked) {
        showMessage("Please accept the Terms of Service and Privacy Policy.");
        termsInput.focus();
        return;
    }

    const theme = selectedTheme.value;

    // Prevent duplicate submissions
    submitButton.disabled = true;
    submitButton.textContent = "Creating Account...";

    try {
        // Create user in Supabase Authentication
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
    emailRedirectTo: "https://roopanjayapal899-gif.github.io/VALGAN/login.html",
    data: {
        username: username,
        selected_theme: theme
    }
            }
        });

        if (error) {
            throw error;
        }

        // Check the registration result
        if (data.user && !data.session) {
            showMessage(
                "Registration successful! Please check your email to verify your account.",
                "success"
            );
        } else if (data.user && data.session) {
            showMessage(
                "VOLGAN account created successfully!",
                "success"
            );

            signupForm.reset();
        } else {
            showMessage(
                "Registration submitted. Please check your email.",
                "success"
            );
        }

    } catch (error) {
        console.error("VOLGAN signup error:", error);

        if (error.message && error.message.toLowerCase().includes("already registered")) {
            showMessage("This email is already registered. Please log in.");
        } else if (error.message && error.message.toLowerCase().includes("password")) {
            showMessage("Please check your password and try again.");
        } else {
            showMessage(
                error.message || "Registration failed. Please try again."
            );
        }

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
    }
});

// Clear old messages when the user edits the form
signupForm.addEventListener("input", function () {
    message.textContent = "";
});

signupForm.addEventListener("change", function () {
    message.textContent = "";
});

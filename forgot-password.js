// ======================================
// VOLGAN - FORGOT PASSWORD
// ======================================

const forgotForm = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const resetButton = document.getElementById("resetButton");
const message = document.getElementById("message");

forgotForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {
        message.textContent = "Enter your email address.";
        return;
    }

    resetButton.disabled = true;
    resetButton.textContent = "Sending...";
    message.textContent = "";

    try {

        const redirectURL = new URL(
            "reset-password.html",
            window.location.href
        ).href;

        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: redirectURL
                }
            );

        if (error) {
            throw error;
        }

        message.textContent =
            "If an account exists for this email, a password reset link has been sent. Please check your inbox.";

        message.style.color = "green";

        forgotForm.reset();

    } catch (error) {

        console.error("Password reset error:", error);

        message.textContent =
            error.message || "Could not send reset link.";

        message.style.color = "red";

    }

    resetButton.disabled = false;
    resetButton.textContent = "Send Reset Link";

});
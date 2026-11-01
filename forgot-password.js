
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

        const redirectURL =
            "https://roopanjayapal899-gif.github.io/VALGAN/reset-password.html";

        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: redirectURL
                }
            );

        if (error) throw error;

        message.textContent =
            "Password reset link sent. Please check your email.";

        message.style.color = "green";

        forgotForm.reset();

    } catch (error) {

        console.error("Password reset error:", error);

        message.textContent =
            error.message || "Could not send reset link.";

        message.style.color = "red";

    } finally {

        resetButton.disabled = false;
        resetButton.textContent = "Send Reset Link";

    }

});

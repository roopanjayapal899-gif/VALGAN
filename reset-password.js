
// ======================================
// VOLGAN - RESET PASSWORD
// ======================================

const resetForm = document.getElementById("resetForm");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const updateButton = document.getElementById("updateButton");
const message = document.getElementById("message");

let recoveryReady = false;

// ======================================
// CHECK RECOVERY SESSION
// ======================================

async function checkRecoverySession() {
    try {
        const url = new URL(window.location.href);

        // Handle Supabase PKCE callback
        const code = url.searchParams.get("code");

        if (code) {
            const { error } =
                await supabaseClient.auth.exchangeCodeForSession(code);

            if (error) throw error;

            // Remove authorization code from address bar
            window.history.replaceState(
                {},
                document.title,
                url.pathname
            );
        }

        // Check recovery session
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!data.session) {
            throw new Error(
                "Invalid or expired reset link. Please request a new link."
            );
        }

        recoveryReady = true;
        updateButton.disabled = false;

        message.textContent =
            "Reset link verified. Enter your new password.";

        message.style.color = "green";

    } catch (error) {
        console.error("Recovery session error:", error);

        message.textContent =
            error.message || "Could not verify reset link.";

        message.style.color = "red";
        updateButton.disabled = true;
    }
}

// ======================================
// UPDATE PASSWORD
// ======================================

resetForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!recoveryReady) {
        message.textContent =
            "Your reset session is not valid.";

        message.style.color = "red";
        return;
    }

    const password = newPassword.value;
    const confirm = confirmPassword.value;

    if (password.length < 8) {
        message.textContent =
            "Password must contain at least 8 characters.";

        message.style.color = "red";
        return;
    }

    if (password !== confirm) {
        message.textContent =
            "Passwords do not match.";

        message.style.color = "red";
        return;
    }

    updateButton.disabled = true;
    updateButton.textContent = "Updating...";

    try {

        const { error } =
            await supabaseClient.auth.updateUser({
                password: password
            });

        if (error) throw error;

        message.textContent =
            "Password updated successfully! Redirecting to login...";

        message.style.color = "green";

        recoveryReady = false;
        resetForm.reset();

        // End recovery session and go to Login
        await supabaseClient.auth.signOut();

        window.location.replace("./login.html");

    } catch (error) {

        console.error("Update password error:", error);

        message.textContent =
            error.message || "Password update failed.";

        message.style.color = "red";

        updateButton.disabled = false;
        updateButton.textContent = "Update Password";
    }
});

// ======================================
// INITIALIZE
// ======================================

updateButton.disabled = true;

checkRecoverySession();

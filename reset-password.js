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

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!data.session) {

            message.textContent =
                "Invalid or expired reset link. Request a new link.";

            message.style.color = "red";

            updateButton.disabled = true;

            return;
        }

        recoveryReady = true;

    } catch (error) {

        console.error(error);

        message.textContent =
            "Could not verify reset link. Please try again.";

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

        setTimeout(async () => {

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";

        }, 2000);

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

checkRecoverySession();
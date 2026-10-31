// ======================================
// VOLGAN - ACCOUNT MANAGEMENT
// ======================================

const deactivateBtn = document.getElementById("deactivateBtn");
const deleteBtn = document.getElementById("deleteBtn");
const accountMessage = document.getElementById("accountMessage");

// Deactivate Account
deactivateBtn.addEventListener("click", () => {

    const confirmDeactivate = confirm(
        "Are you sure you want to deactivate your VOLGAN account?"
    );

    if (!confirmDeactivate) return;

    accountMessage.style.color = "#2563eb";

    accountMessage.textContent =
        "Deactivation request noted. Backend integration is required to complete this action.";
});

// Delete Account
deleteBtn.addEventListener("click", () => {

    const confirmDelete = confirm(
        "WARNING: Do you really want to permanently delete your account?"
    );

    if (!confirmDelete) return;

    const finalConfirm = confirm(
        "This action may permanently remove your account and data. Continue?"
    );

    if (!finalConfirm) return;

    accountMessage.style.color = "#dc2626";

    accountMessage.textContent =
        "Deletion request noted. Backend integration is required to complete this action.";
});
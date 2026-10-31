// ======================================
// VOLGAN - SETTINGS FRONTEND
// ======================================

const logoutButton =
    document.getElementById("logoutButton");

const settingsMessage =
    document.getElementById("settingsMessage");

const settingsItems =
    document.querySelectorAll(".settings-item");


// ======================================
// SETTINGS NAVIGATION
// ======================================

const settingsRoutes = {
    profile: "profile.html",
    password: "forgot-password.html",
    email: "profile.html",
    privacy: "privacy.html",
    blocked: null,
    notifications: "notifications.html",
    about: null
};

settingsItems.forEach(item => {

    item.addEventListener("click", () => {

        const action = item.dataset.action;
        const route = settingsRoutes[action];

        if (route) {
            window.location.href = route;
            return;
        }

        const messages = {
            privacy: "Privacy Settings will be added later.",
            blocked: "Blocked Users will be added later.",
            about: "VOLGAN - Your world. Your current."
        };

        settingsMessage.textContent =
            messages[action] || "Coming soon.";

    });

});


// ======================================
// LOGOUT
// ======================================

logoutButton.addEventListener("click", async () => {

    const confirmed = window.confirm(
        "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        console.error("Logout error:", error);

        settingsMessage.textContent =
            "Could not log out. Please try again.";

        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";

        return;
    }

    window.location.href = "login.html";

});
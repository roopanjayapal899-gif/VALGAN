// VOLGAN HOME PAGE
const userAvatar = document.getElementById("userAvatar");
const feedContainer = document.getElementById("feedContainer");

const createPostButton = document.getElementById("createPostButton");
const textPostButton = document.getElementById("textPostButton");

async function initializeHomePage() {
    if (typeof supabaseClient === "undefined") {
        welcomeMessage.textContent = "Connection error";
        feedContainer.textContent = "Please check supabase.js.";
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;

        const session = data.session;

        if (!session) {
    console.log("VOLGAN: No session found on Home page");
    window.location.replace("./login.html");
    return;
}

console.log("VOLGAN: Session found on Home page", session.user.email);

        const user = session.user;
        const metadata = user.user_metadata || {};

        const username =
            metadata.username ||
            user.email?.split("@")[0] ||
            "VOLGAN User";

        const theme = metadata.selected_theme || "VOLGAN";

        welcomeMessage.textContent = "Welcome, " + username + "!";
        userTheme.textContent = "Your Theme: " + theme;
        userAvatar.textContent = username.charAt(0).toUpperCase();

    } catch (error) {
        console.error("VOLGAN Home Error:", error);

        welcomeMessage.textContent = "Unable to load your account.";
        feedContainer.textContent =
            "Please refresh the page and try again.";
    }
}

// Open Create Post page
function openCreatePost() {
    window.location.href = "create-post.html";
}

createPostButton.addEventListener("click", openCreatePost);
textPostButton.addEventListener("click", openCreatePost);

// Start
initializeHomePage();

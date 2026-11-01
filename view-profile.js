
// ======================================
// VOLGAN - PUBLIC PROFILE + MATE SYSTEM
// ======================================

const publicAvatar = document.getElementById("publicAvatar");
const publicName = document.getElementById("publicName");
const publicUsername = document.getElementById("publicUsername");
const publicBio = document.getElementById("publicBio");
const publicPosts = document.getElementById("publicPosts");

const friendButton = document.getElementById("friendButton");
const blockButton = document.getElementById("blockButton");

let currentUser = null;
let viewedUser = null;
let currentRequest = null;

// ======================================
// SAFE ELEMENT
// ======================================

function createElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

// ======================================
// LOGIN CHECK
// ======================================

async function checkLogin() {
    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "login.html";
        return false;
    }

    currentUser = data.user;
    return true;
}

// ======================================
// LOAD PUBLIC PROFILE
// ======================================

async function loadPublicProfile() {
    const params = new URLSearchParams(
        window.location.search
    );

    const profileId = params.get("id");

    if (!profileId) {
        publicName.textContent = "Profile not found.";
        return;
    }

    if (profileId === currentUser.id) {
        window.location.href = "profile.html";
        return;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, full_name, bio, avatar_path")
        .eq("id", profileId)
        .maybeSingle();

    if (error || !data) {
        console.error("Profile error:", error);
        publicName.textContent = "Could not load profile.";
        return;
    }

    viewedUser = data;

    publicName.textContent =
        data.full_name || "VOLGAN User";

    publicUsername.textContent =
        "@" + (data.username || "user");

    publicBio.textContent =
        data.bio || "No bio added yet.";

    await loadPublicAvatar(data.avatar_path);
    await loadPublicPosts(data.id);
    await checkFriendStatus();
}

// ======================================
// LOAD PROFILE IMAGE
// ======================================

async function loadPublicAvatar(imagePath) {
    publicAvatar.src = "";
    publicAvatar.alt = "No profile photo";

    if (!imagePath) {
        publicAvatar.src =
            "https://placehold.co/200x200?text=User";
        return;
    }

    const { data, error } = await supabaseClient.storage
        .from("profile-images")
        .createSignedUrl(imagePath, 3600);

    if (error || !data?.signedUrl) {
        console.error("Avatar error:", error);

        publicAvatar.src =
            "https://placehold.co/200x200?text=User";

        return;
    }

    publicAvatar.src = data.signedUrl;
}

// ======================================
// LOAD PUBLIC MOMENTS
// ======================================

async function loadPublicPosts(userId) {
    publicPosts.replaceChildren();

    const { data, error } = await supabaseClient
        .from("posts")
        .select("id, content, image_url, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("Moments error:", error);

        publicPosts.appendChild(
            createElement("p", "Could not load Moments.")
        );

        return;
    }

    if (!data || data.length === 0) {
        publicPosts.appendChild(
            createElement("p", "No Moments yet.")
        );
        return;
    }

    for (const post of data) {
        const card = document.createElement("article");
        card.className = "public-post-card";

        card.appendChild(
            createElement("p", post.content || "")
        );

        if (post.image_url) {
            const { data: imageData, error: imageError } =
                await supabaseClient.storage
                    .from("post-images")
                    .createSignedUrl(post.image_url, 3600);

            if (!imageError && imageData?.signedUrl) {
                const image = document.createElement("img");
                image.src = imageData.signedUrl;
                image.alt = "Moment image";
                image.loading = "lazy";

                card.appendChild(image);
            }
        }

        card.appendChild(
            createElement(
                "small",
                new Date(post.created_at).toLocaleString(),
                "public-post-date"
            )
        );

        publicPosts.appendChild(card);
    }
}

// ======================================
// CHECK MATE STATUS
// ======================================

async function checkFriendStatus() {
    friendButton.disabled = true;
    friendButton.classList.remove("unmate");
    friendButton.textContent = "Loading...";

    const { data, error } = await supabaseClient
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${viewedUser.id}),and(sender_id.eq.${viewedUser.id},receiver_id.eq.${currentUser.id})`
        );

    if (error) {
        console.error("Mate status error:", error);
        friendButton.textContent = "Try Again";
        friendButton.disabled = false;
        return;
    }

    currentRequest = data?.[0] || null;

    if (!currentRequest) {
        friendButton.textContent = "+ Mate";

    } else if (currentRequest.status === "accepted") {
        friendButton.textContent = "✓ Mate";
        friendButton.classList.add("unmate");

    } else if (currentRequest.status === "pending") {
        if (currentRequest.sender_id === currentUser.id) {
            friendButton.textContent = "Mate Request Sent";
        } else {
            friendButton.textContent = "Accept Mate";
        }

    } else {
        friendButton.textContent = "+ Mate";
    }

    friendButton.disabled = false;
}

// ======================================
// SEND / ACCEPT / UNMATE
// ======================================

async function handleFriendButton() {
    if (!viewedUser || !currentUser) return;

    friendButton.disabled = true;

    try {
        // UNMATE
        if (currentRequest?.status === "accepted") {
            friendButton.textContent = "Unmating...";

            const { error } = await supabaseClient
                .from("friend_requests")
                .delete()
                .eq("id", currentRequest.id);

            if (error) throw error;

            currentRequest = null;

            await checkFriendStatus();
            return;
        }

        // ACCEPT INCOMING MATE REQUEST
        if (
            currentRequest?.status === "pending" &&
            currentRequest.receiver_id === currentUser.id
        ) {
            friendButton.textContent = "Accepting...";

            const { error } = await supabaseClient
                .from("friend_requests")
                .update({ status: "accepted" })
                .eq("id", currentRequest.id);

            if (error) throw error;

            alert("You are now Mates!");

            await checkFriendStatus();
            return;
        }

        // REQUEST ALREADY SENT
        if (
            currentRequest?.status === "pending" &&
            currentRequest.sender_id === currentUser.id
        ) {
            friendButton.disabled = false;
            return;
        }

        // SEND NEW MATE REQUEST
        friendButton.textContent = "Sending...";

        const { error } = await supabaseClient
            .from("friend_requests")
            .insert({
                sender_id: currentUser.id,
                receiver_id: viewedUser.id,
                status: "pending"
            });

        if (error) throw error;

        alert("Mate request sent!");

        await checkFriendStatus();

    } catch (error) {
        console.error("Mate Action Error:", error);

        alert(error.message || "Unable to update Mate status.");

        await checkFriendStatus();
    }
}

// ======================================
// BLOCK BUTTON - NOT CONNECTED YET
// ======================================

blockButton.addEventListener("click", () => {
    alert("Block feature will be connected next.");
});

// ======================================
// BUTTON EVENTS
// ======================================

friendButton.addEventListener(
    "click",
    handleFriendButton
);

// ======================================
// INITIALIZE
// ======================================

async function initializePublicProfile() {
    const loggedIn = await checkLogin();

    if (!loggedIn) return;

    await loadPublicProfile();
}

initializePublicProfile();

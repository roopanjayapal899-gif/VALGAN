
// ======================================
// VOLGAN HOME PAGE + PUBLIC FEED
// ======================================

const userAvatar = document.getElementById("userAvatar");
const feedContainer = document.getElementById("feedContainer");
const feedFilter = document.getElementById("feedFilter");

const createPostButton = document.getElementById("createPostButton");
const textPostButton = document.getElementById("textPostButton");

const IMAGE_BUCKET = "post-images";
const PROFILE_BUCKET = "profile-images";
let currentUser = null;

// ======================================
// IMAGE URL HELPER
// ======================================

async function getImageURL(bucket, path) {
    if (!path) return null;

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    const { data, error } = await supabaseClient
        .storage
        .from(bucket)
        .createSignedUrl(path, 3600);

    if (error) {
        console.error("Image URL error:", error);
        return null;
    }

    return data.signedUrl;
}

// ======================================
// HOME INITIALIZATION
// ======================================

async function initializeHomePage() {
    if (typeof supabaseClient === "undefined") {
        feedContainer.textContent = "Supabase connection failed.";
        return;
    }

    try {
        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!data.session) {
            window.location.replace("login.html");
            return;
        }

        const user = data.session.user;
        const user = currentUser;
        const metadata = user.user_metadata || {};

        const username =
            metadata.username ||
            user.email?.split("@")[0] ||
            "VOLGAN User";

        userAvatar.textContent = username.charAt(0).toUpperCase();

        await loadFeed();

    } catch (error) {
        console.error("Home initialization error:", error);
        feedContainer.textContent = "Unable to load VOLGAN.";
    }
}

// ======================================
// LOAD PUBLIC FEED
// ======================================

async function loadFeed() {
    feedContainer.textContent = "Loading posts...";

    try {
        const { data: posts, error } = await supabaseClient
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

        if (error) throw error;

        if (!posts || posts.length === 0) {
            feedContainer.textContent = "No posts yet. Be the first to post!";
            return;
        }

        const userIds = [...new Set(posts.map(post => post.user_id))];

        const { data: profiles, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, avatar_path")
                .in("id", userIds);

        if (profileError) throw profileError;

        const profileMap = new Map(
            (profiles || []).map(profile => [profile.id, profile])
        );

        const filter = feedFilter?.value || "all";

        let visiblePosts = posts;

        if (filter === "latest") {
            visiblePosts = [...posts].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
        }

        feedContainer.replaceChildren();

        for (const post of visiblePosts) {
            const profile = profileMap.get(post.user_id);

            const postCard = document.createElement("article");
            postCard.className = "volgan-post-card";

            // Profile header
            const header = document.createElement("div");
            header.className = "volgan-post-header";

            const avatar = document.createElement("div");
            avatar.className = "volgan-post-avatar";

            const fullName = profile?.full_name || "VOLGAN User";
            avatar.textContent = fullName.charAt(0).toUpperCase();

            if (profile?.avatar_path) {
                const avatarURL = await getImageURL(
                    PROFILE_BUCKET,
                    profile.avatar_path
                );

                if (avatarURL) {
                    const avatarImage = document.createElement("img");
                    avatarImage.src = avatarURL;
                    avatarImage.alt = fullName;
                    avatarImage.className = "volgan-avatar-image";

                    avatar.replaceChildren(avatarImage);
                }
            }

            const name = document.createElement("strong");
            name.textContent = fullName;

            header.append(avatar, name);

            // EDIT POST
if (post.user_id === currentUser.id) {

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "edit-post-button";

    editButton.addEventListener("click", async () => {

        const newContent = prompt(
            "Edit your post:",
            post.content || ""
        );

        if (newContent === null) return;

        if (!newContent.trim() && !post.image_url) {
            alert("Post cannot be empty.");
            return;
        }

        const { error } = await supabaseClient
            .from("posts")
            .update({ content: newContent.trim() })
            .eq("id", post.id)
            .eq("user_id", currentUser.id);

        if (error) {
            console.error("Edit error:", error);
            alert("Unable to edit post.");
            return;
        }

        alert("Post updated!");
        await loadFeed();
    });

    header.appendChild(editButton);
}
            
            postCard.appendChild(header);

            // Post text
            if (post.content && post.content.trim()) {
                const content = document.createElement("p");
                content.className = "volgan-post-content";
                content.textContent = post.content;
                postCard.appendChild(content);
            }

            // Post image
            if (post.image_url) {
                const imageURL = await getImageURL(
                    IMAGE_BUCKET,
                    post.image_url
                );

                if (imageURL) {
                    const image = document.createElement("img");
                    image.src = imageURL;
                    image.alt = "Post image";
                    image.className = "volgan-post-image";
                    image.loading = "lazy";
                    postCard.appendChild(image);
                }
            }

            feedContainer.appendChild(postCard);
        }

    } catch (error) {
        console.error("VOLGAN Feed Error:", error);
        feedContainer.textContent =
            "Unable to load posts. Please try again.";
    }
}

// ======================================
// CREATE POST NAVIGATION
// ======================================

function openCreatePost() {
    window.location.href = "create-post.html";
}

createPostButton?.addEventListener("click", openCreatePost);
textPostButton?.addEventListener("click", openCreatePost);

// ======================================
// FEED FILTER
// ======================================

feedFilter?.addEventListener("change", loadFeed);

// ======================================
// START
// ======================================

initializeHomePage();

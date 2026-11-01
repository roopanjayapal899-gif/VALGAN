
// ======================================
// VOLGAN HOME PAGE
// PUBLIC FEED + CREATE + EDIT + DELETE
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
        console.error("Image URL Error:", error);
        return null;
    }

    return data?.signedUrl || null;
}

// ======================================
// HOME INITIALIZATION
// ======================================

async function initializeHomePage() {
    if (!feedContainer) {
        console.error("feedContainer not found.");
        return;
    }

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

        currentUser = data.session.user;

        const metadata = currentUser.user_metadata || {};

const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.username ||
    "VOLGAN User";

        if (userAvatar) {
    userAvatar.textContent =
        username.charAt(0).toUpperCase();

    const avatarPath = metadata.avatar_path;

    if (avatarPath) {
        const avatarURL = await getImageURL(
            PROFILE_BUCKET,
            avatarPath
        );

        if (avatarURL) {
            const avatarImage = document.createElement("img");

            avatarImage.src = avatarURL;
            avatarImage.alt = "My Profile";
            avatarImage.style.width = "100%";
            avatarImage.style.height = "100%";
            avatarImage.style.objectFit = "cover";
            avatarImage.style.borderRadius = "50%";

            userAvatar.replaceChildren(avatarImage);
        }
    }
        }

        await loadFeed();

    } catch (error) {
        console.error("Home Initialization Error:", error);
        feedContainer.textContent =
            "Unable to load VOLGAN. Please refresh.";
    }
}

// ======================================
// LOAD PUBLIC FEED
// ======================================

async function loadFeed() {
    if (!currentUser || !feedContainer) return;

    feedContainer.textContent = "Loading posts...";

    try {
        const { data: posts, error } = await supabaseClient
            .from("posts")
            .select("id, user_id, content, image_url, created_at")
            .order("created_at", { ascending: false })
            .limit(30);

        if (error) throw error;

        if (!posts || posts.length === 0) {
            feedContainer.replaceChildren();

            const emptyMessage = document.createElement("div");
            emptyMessage.className = "empty-feed";

            const icon = document.createElement("div");
            icon.className = "empty-icon";
            icon.textContent = "🌊";

            const heading = document.createElement("h3");
            heading.textContent =
                "Your VOLGAN journey starts here!";

            const description = document.createElement("p");
            description.textContent =
                "Posts from your community will appear here.";

            emptyMessage.append(icon, heading, description);
            feedContainer.appendChild(emptyMessage);

            return;
        }

        // GET USER PROFILES
        const userIds = [
            ...new Set(posts.map(post => post.user_id))
        ];

        const { data: profiles, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, avatar_path")
                .in("id", userIds);

        if (profileError) throw profileError;

        const profileMap = new Map(
            (profiles || []).map(profile => [
                profile.id,
                profile
            ])
        );

        const filter = feedFilter?.value || "all";

        let visiblePosts = [...posts];

        if (filter === "latest") {
            visiblePosts.sort(
                (a, b) =>
                    new Date(b.created_at) -
                    new Date(a.created_at)
            );
        }

        feedContainer.replaceChildren();

        // DISPLAY POSTS
        for (const post of visiblePosts) {

            const profile = profileMap.get(post.user_id);

            const fullName =
                profile?.full_name || "VOLGAN User";

            const postCard = document.createElement("article");
            postCard.className = "volgan-post-card";

            // ----------------------------------
            // POST HEADER
            // ----------------------------------

            const header = document.createElement("div");
            header.className = "volgan-post-header";

            const avatar = document.createElement("div");
            avatar.className = "volgan-post-avatar";
            avatar.textContent =
                fullName.charAt(0).toUpperCase();

            if (profile?.avatar_path) {
                const avatarURL = await getImageURL(
                    PROFILE_BUCKET,
                    profile.avatar_path
                );

                if (avatarURL) {
                    const avatarImage =
                        document.createElement("img");

                    avatarImage.src = avatarURL;
                    avatarImage.alt = fullName;
                    avatarImage.className =
                        "volgan-avatar-image";

                    avatar.replaceChildren(avatarImage);
                }
            }

            const name = document.createElement("strong");
            name.textContent = fullName;

            header.append(avatar, name);

            // ----------------------------------
            // THREE DOT MENU - OWN POSTS ONLY
            // ----------------------------------

            if (post.user_id === currentUser.id) {

                const menuWrapper =
                    document.createElement("div");

                menuWrapper.className = "post-menu-wrapper";

                menuWrapper.style.marginLeft = "auto";
                menuWrapper.style.position = "relative";

                const menuButton =
                    document.createElement("button");

                menuButton.type = "button";
                menuButton.textContent = "⋯";
                menuButton.className = "post-menu-button";
                menuButton.setAttribute(
                    "aria-label",
                    "Post options"
                );

                menuButton.style.border = "none";
                menuButton.style.background = "transparent";
                menuButton.style.fontSize = "26px";
                menuButton.style.cursor = "pointer";

                const menu = document.createElement("div");
                menu.className = "post-menu";
                menu.hidden = true;

                menu.style.position = "absolute";
                menu.style.right = "0";
                menu.style.top = "35px";
                menu.style.zIndex = "100";
                menu.style.minWidth = "140px";
                menu.style.background = "#ffffff";
                menu.style.border = "1px solid #dddddd";
                menu.style.borderRadius = "8px";
                menu.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.15)";

                function createMenuItem(label, color) {
                    const button =
                        document.createElement("button");

                    button.type = "button";
                    button.textContent = label;
                    button.style.display = "block";
                    button.style.width = "100%";
                    button.style.padding = "12px";
                    button.style.border = "none";
                    button.style.background = "#ffffff";
                    button.style.textAlign = "left";
                    button.style.cursor = "pointer";
                    button.style.color = color || "#222222";

                    return button;
                }

                const editButton =
                    createMenuItem("Edit Post");

                const deleteButton =
                    createMenuItem("Delete Post", "#dc2626");

                menuButton.addEventListener("click", () => {
                    menu.hidden = !menu.hidden;
                });

                editButton.addEventListener("click", async () => {
                    menu.hidden = true;
                    await editPost(post);
                });

                deleteButton.addEventListener("click", async () => {
                    menu.hidden = true;
                    await deletePost(post);
                });

                menu.append(editButton, deleteButton);

                menuWrapper.append(menuButton, menu);
                header.appendChild(menuWrapper);
            }

            postCard.appendChild(header);


            // POST DATE AND TIME
const postDate = document.createElement("small");
postDate.className = "volgan-post-date";

postDate.textContent = new Date(
    post.created_at
).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
});

postCard.appendChild(postDate);

            // ----------------------------------
            // POST TEXT
            // ----------------------------------

            if (post.content && post.content.trim()) {
                const content = document.createElement("p");

                content.className = "volgan-post-content";
                content.textContent = post.content;

                postCard.appendChild(content);
            }

            // ----------------------------------
            // POST IMAGE
            // ----------------------------------

            if (post.image_url) {

                const imageURL = await getImageURL(
                    IMAGE_BUCKET,
                    post.image_url
                );

                if (imageURL) {
                    const image =
                        document.createElement("img");

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
// EDIT POST
// ======================================

async function editPost(post) {

    if (!currentUser || post.user_id !== currentUser.id) {
        alert("You cannot edit this post.");
        return;
    }

    const newContent = prompt(
        "Edit your post:",
        post.content || ""
    );

    if (newContent === null) return;

    if (!newContent.trim() && !post.image_url) {
        alert("Post cannot be empty.");
        return;
    }

    if (newContent.length > 2000) {
        alert("Post cannot exceed 2000 characters.");
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("posts")
            .update({
                content: newContent.trim()
            })
            .eq("id", post.id)
            .eq("user_id", currentUser.id)
            .select("id");

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error("Post was not updated.");
        }

        alert("Post updated successfully!");

        await loadFeed();

    } catch (error) {
        console.error("Edit Post Error:", error);
        alert(error.message || "Unable to edit post.");
    }
}

// ======================================
// DELETE POST
// ======================================

async function deletePost(post) {

    if (!currentUser || post.user_id !== currentUser.id) {
        alert("You cannot delete this post.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
        const { data, error } = await supabaseClient
            .from("posts")
            .delete()
            .eq("id", post.id)
            .eq("user_id", currentUser.id)
            .select("id");

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error("Post was not deleted.");
        }

        // DELETE POST IMAGE FROM STORAGE
        if (
            post.image_url &&
            !post.image_url.startsWith("http")
        ) {
            const { error: storageError } =
                await supabaseClient
                    .storage
                    .from(IMAGE_BUCKET)
                    .remove([post.image_url]);

            if (storageError) {
                console.error(
                    "Storage Image Delete Error:",
                    storageError
                );
            }
        }

        alert("Post deleted successfully!");

        await loadFeed();

    } catch (error) {
        console.error("Delete Post Error:", error);
        alert(error.message || "Unable to delete post.");
    }
}

// ======================================
// CREATE POST NAVIGATION
// ======================================

function openCreatePost() {
    window.location.href = "create-post.html";
}

createPostButton?.addEventListener(
    "click",
    openCreatePost
);

textPostButton?.addEventListener(
    "click",
    openCreatePost
);

// ======================================
// FEED FILTER
// ======================================

feedFilter?.addEventListener("change", loadFeed);

// ======================================
// START VOLGAN
// ======================================

initializeHomePage();

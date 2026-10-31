// ========================================
// VOLGAN PROFILE.JS
// ========================================

const profileAvatar = document.getElementById("profileAvatar");
const profileImageInput = document.getElementById("profileImageInput");
const profileImageMessage = document.getElementById("profileImageMessage");

const profileName = document.getElementById("profileName");
const profileUsername = document.getElementById("profileUsername");
const profileTheme = document.getElementById("profileTheme");
const profileEmail = document.getElementById("profileEmail");

const editProfileButton = document.getElementById("editProfileButton");
const logoutButton = document.getElementById("logoutButton");

let currentUser = null;

// Supabase Storage bucket name
const AVATAR_BUCKET = "profile-images";

// ========================================
// LOAD PROFILE
// ========================================

async function loadProfile() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        const session = data.session;

        if (!session) {
            window.location.href = "login.html";
            return;
        }

        currentUser = session.user;

        const metadata = currentUser.user_metadata || {};

        profileName.textContent =
            metadata.full_name || metadata.name || "Your Name";

        profileUsername.textContent =
            "@" + (metadata.username || "username");

        profileTheme.textContent =
            "Theme: " + (metadata.selected_theme || "VOLGA");

        profileEmail.textContent = currentUser.email || "";

        // Load profile image
        await loadProfileImage(metadata.avatar_path);

        await loadMyPosts();

    } catch (error) {
        console.error("Profile loading error:", error);
        profileName.textContent = "Unable to load profile";
    }
}

// ========================================
// LOAD PROFILE IMAGE
// ========================================

async function loadProfileImage(imagePath) {
    if (!profileAvatar) return;

    if (!imagePath) {
        profileAvatar.src = "";
        profileAvatar.style.display = "block";
        profileAvatar.alt = "Choose a profile picture";
        return;
    }

    try {
        const { data, error } = await supabaseClient.storage
            .from("profile-images")
            .createSignedUrl(imagePath, 3600);

        if (error) throw error;

        profileAvatar.src = data.signedUrl;
        profileAvatar.style.display = "block";

    } catch (error) {
        console.error("Profile image error:", error);
        profileAvatar.style.display = "block";
    }
}

// ========================================
// UPLOAD PROFILE IMAGE
// ========================================

if (profileImageInput) {
    profileImageInput.addEventListener("change", async function () {
        const file = this.files[0];

        if (!file || !currentUser) return;

        // Check file type
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            profileImageMessage.textContent =
                "Please select JPG, PNG or WebP image.";
            this.value = "";
            return;
        }

        // Maximum 5 MB
        if (file.size > 5 * 1024 * 1024) {
            profileImageMessage.textContent =
                "Image must be smaller than 5 MB.";
            this.value = "";
            return;
        }

        profileImageMessage.textContent = "Uploading image...";

        try {
            const extension = file.type === "image/png"
                ? "png"
                : file.type === "image/webp"
                    ? "webp"
                    : "jpg";

            const imagePath =
                currentUser.id + "/" + crypto.randomUUID() + "." + extension;

            // Upload image to Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
                .from(AVATAR_BUCKET)
                .upload(imagePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                });

            if (uploadError) throw uploadError;

            // Save image path in user metadata
            const { data, error: updateError } =
                await supabaseClient.auth.updateUser({
                    data: {
                        avatar_path: imagePath
                    }
                });

            if (updateError) {
                // Remove newly uploaded image if metadata update fails
                await supabaseClient.storage
                    .from(AVATAR_BUCKET)
                    .remove([imagePath]);

                throw updateError;
            }

            currentUser = data.user;

            // Show uploaded image
            await loadProfileImage(imagePath);

            profileImageMessage.textContent =
                "Profile picture updated successfully!";

        } catch (error) {
            console.error("Image upload error:", error);

            profileImageMessage.textContent =
                "Upload failed: " + error.message;
        }

        this.value = "";
    });
}

// ========================================
// EDIT PROFILE
// ========================================

const editProfileForm = document.getElementById("editProfileForm");
const cancelEditButton = document.getElementById("cancelEditButton");
const saveProfileButton = document.getElementById("saveProfileButton");

const editName = document.getElementById("editName");
const editUsername = document.getElementById("editUsername");
const editBio = document.getElementById("editBio");

editProfileButton.addEventListener("click", function () {
if (!currentUser) return;

const metadata = currentUser.user_metadata || {};

editName.value = metadata.full_name || metadata.name || "";
editUsername.value = metadata.username || "";
editBio.value = metadata.bio || "";

editProfileForm.hidden = false;
editProfileButton.hidden = true;

});

cancelEditButton.addEventListener("click", function () {
editProfileForm.hidden = true;
editProfileButton.hidden = false;
});

editProfileForm.addEventListener("submit", async function (event) {
event.preventDefault();

const name = editName.value.trim();
const username = editUsername.value.trim().replace(/^@/, "");
const bio = editBio.value.trim();

if (!name || !username) {
    alert("Name and username are required.");
    return;
}

if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
    alert("Username must be 3–20 characters: letters, numbers, _ or .");
    return;
}

saveProfileButton.disabled = true;
saveProfileButton.textContent = "Saving...";

try {
    const { data, error } = await supabaseClient.auth.updateUser({
        data: {
            full_name: name,
            username: username,
            bio: bio
        }
    });

    if (error) throw error;

    currentUser = data.user;

    profileName.textContent = name;
    profileUsername.textContent = "@" + username;

    if (profileTheme) {
        profileTheme.textContent =
            "Theme: " +
            (currentUser.user_metadata.selected_theme || "VOLGA");
    }

    editProfileForm.hidden = true;
    editProfileButton.hidden = false;

    if (profileMessage) {
        profileMessage.textContent = "Profile updated successfully!";
    }

} catch (error) {
    console.error("Profile update error:", error);

    if (profileMessage) {
        profileMessage.textContent =
            "Could not save profile: " + error.message;
    }

} finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = "Save Changes";
}

});

// ========================================
// LOGOUT
// ========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        const confirmLogout = confirm("Do you want to logout?");

        if (!confirmLogout) return;

        logoutButton.disabled = true;

        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            window.location.href = "login.html";

        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed: " + error.message);
            logoutButton.disabled = false;
        }
    });
}

// ========================================
// START
// ========================================

loadProfile();

// ========================================
// LOAD MY POSTS
// ========================================

const postsContainer = document.getElementById("postsContainer");

async function loadMyPosts() {
    if (!postsContainer || !currentUser) return;

    postsContainer.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Loading your posts...";
    postsContainer.appendChild(loadingMessage);

    try {
        const { data: posts, error } = await supabaseClient
            .from("posts")
            .select("id, content, image_url, created_at")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        postsContainer.replaceChildren();

        if (!posts || posts.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No posts yet. Share your first post!";
            postsContainer.appendChild(emptyMessage);
            return;
        }

        posts.forEach((post) => {
            const card = document.createElement("article");
            card.className = "my-post-card";

            if (post.content) {
                const content = document.createElement("p");
                content.className = "my-post-content";
                content.textContent = post.content;
                card.appendChild(content);
            }

            if (post.image_url) {
                const image = document.createElement("img");
                image.className = "my-post-image";
                image.alt = "Post image";
                image.loading = "lazy";

                // Private Storage bucket: image_url contains the file path.
                supabaseClient.storage
                    .from("post-images")
                    .createSignedUrl(post.image_url, 3600)
                    .then(({ data, error }) => {
                        if (!error && data?.signedUrl) {
                            image.src = data.signedUrl;
                        } else {
                            image.alt = "Unable to load post image";
                        }
                    });

                card.appendChild(image);
            }

            const date = document.createElement("small");
            date.className = "my-post-date";
            date.textContent = new Date(post.created_at).toLocaleString();
            card.appendChild(date);

            postsContainer.appendChild(card);
        });

        const postCount = document.getElementById("postCount");
        if (postCount) {
            postCount.textContent = posts.length;
        }

    } catch (error) {
        console.error("My Posts loading error:", error);

        postsContainer.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.textContent =
            "Could not load posts. Please check your database settings.";
        postsContainer.appendChild(errorMessage);
    }
}
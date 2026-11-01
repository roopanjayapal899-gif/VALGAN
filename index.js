
// ======================================
// VOLGAN HOME PAGE
// PUBLIC FEED + INLINE EDIT + DELETE
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
    if (!feedContainer) return;

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
                fullName.charAt(0).toUpperCase();

            if (metadata.avatar_path) {
                const avatarURL = await getImageURL(
                    PROFILE_BUCKET,
                    metadata.avatar_path
                );

                if (avatarURL) {
                    const img = document.createElement("img");
                    img.src = avatarURL;
                    img.alt = fullName;
                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.objectFit = "cover";
                    img.style.borderRadius = "50%";

                    userAvatar.replaceChildren(img);
                }
            }
        }

        await loadFeed();

    } catch (error) {
        console.error("Home Initialization Error:", error);
        feedContainer.textContent =
            "Unable to load VOLGAN: " + error.message;
    }
}

// ======================================
// LOAD PUBLIC FEED
// ======================================

async function loadFeed() {
    if (!currentUser || !feedContainer) return;

    feedContainer.textContent = "Loading Moments...";

    try {
        const { data: posts, error } = await supabaseClient
            .from("posts")
            .select("id, user_id, content, image_url, created_at")
            .order("created_at", { ascending: false })
            .limit(30);

        if (error) throw error;

        if (!posts || posts.length === 0) {
            feedContainer.replaceChildren();

            const empty = document.createElement("div");
            empty.className = "empty-feed";

            const heading = document.createElement("h3");
            heading.textContent = "Your VOLGAN journey starts here!";

            const description = document.createElement("p");
            description.textContent =
                "Moments from your community will appear here.";

            empty.append(heading, description);
            feedContainer.appendChild(empty);
            return;
        }

        const userIds = [...new Set(posts.map(post => post.user_id))];

        const { data: profiles, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, username, avatar_path")
                .in("id", userIds);

        if (profileError) throw profileError;

        const profileMap = new Map(
            (profiles || []).map(profile => [profile.id, profile])
        );

        const visiblePosts = [...posts];

        if (feedFilter?.value === "latest") {
            visiblePosts.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
        }

        feedContainer.replaceChildren();

        for (const post of visiblePosts) {
            const profile = profileMap.get(post.user_id);
            const isOwnPost = post.user_id === currentUser.id;

            const metadata = isOwnPost
                ? currentUser.user_metadata || {}
                : {};

            const fullName =
                profile?.full_name ||
                metadata.full_name ||
                metadata.name ||
                profile?.username ||
                "VOLGAN User";

            const avatarPath =
                profile?.avatar_path ||
                (isOwnPost ? metadata.avatar_path : null);

            const card = document.createElement("article");
            card.className = "volgan-post-card";

            // HEADER
            const header = document.createElement("div");
            header.className = "volgan-post-header";

            const avatar = document.createElement("div");
            avatar.className = "volgan-post-avatar";
            avatar.textContent = fullName.charAt(0).toUpperCase();

            if (avatarPath) {
                const url = await getImageURL(PROFILE_BUCKET, avatarPath);

                if (url) {
                    const img = document.createElement("img");
                    img.src = url;
                    img.alt = fullName;
                    img.className = "volgan-avatar-image";
                    avatar.replaceChildren(img);
                }
            }

            const name = document.createElement("strong");
            name.textContent = fullName;

            header.append(avatar, name);

            // THREE DOT MENU
            if (isOwnPost) {
                const wrapper = document.createElement("div");
                wrapper.className = "post-menu-wrapper";
                wrapper.style.marginLeft = "auto";
                wrapper.style.position = "relative";

                const menuButton = document.createElement("button");
                menuButton.type = "button";
                menuButton.textContent = "⋯";
                menuButton.className = "post-menu-button";

                const menu = document.createElement("div");
                menu.className = "post-menu";
                menu.hidden = true;

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Edit Moment";

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.textContent = "Delete Moment";

                menuButton.addEventListener("click", () => {
                    menu.hidden = !menu.hidden;
                });

                editButton.addEventListener("click", () => {
                    menu.hidden = true;
                    openInlineEditor(post, card);
                });

                deleteButton.addEventListener("click", async () => {
                    menu.hidden = true;
                    await deletePost(post);
                });

                menu.append(editButton, deleteButton);
                wrapper.append(menuButton, menu);
                header.appendChild(wrapper);
            }

            card.appendChild(header);

            // DATE AND TIME
            const date = document.createElement("small");
            date.className = "volgan-post-date";
            date.textContent = new Date(post.created_at).toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                }
            );
            card.appendChild(date);

            // TEXT
            if (post.content?.trim()) {
                const content = document.createElement("p");
                content.className = "volgan-post-content";
                content.textContent = post.content;
                card.appendChild(content);
            }

            // IMAGE
            if (post.image_url) {
                const url = await getImageURL(
                    IMAGE_BUCKET,
                    post.image_url
                );

                if (url) {
                    const img = document.createElement("img");
                    img.src = url;
                    img.alt = "Moment image";
                    img.className = "volgan-post-image";
                    img.loading = "lazy";
                    card.appendChild(img);
                }
            }

            feedContainer.appendChild(card);
        }

    } catch (error) {
        console.error("VOLGAN Feed Error:", error);
        feedContainer.textContent =
            "Unable to load Moments: " + error.message;
    }
}

// ======================================
// INLINE EDITOR
// ======================================

function openInlineEditor(post, card) {
    if (!currentUser || post.user_id !== currentUser.id) return;

    if (card.querySelector(".inline-edit-panel")) return;

    const editor = document.createElement("section");
    editor.className = "inline-edit-panel";
    editor.style.padding = "16px";
    editor.style.marginTop = "15px";
    editor.style.border = "1px solid #ddd";
    editor.style.borderRadius = "12px";

    const heading = document.createElement("h3");
    heading.textContent = "Edit Moment";

    const textarea = document.createElement("textarea");
    textarea.value = post.content || "";
    textarea.maxLength = 2000;
    textarea.rows = 5;
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";

    const preview = document.createElement("img");
    preview.style.width = "100%";
    preview.style.maxHeight = "300px";
    preview.style.objectFit = "contain";
    preview.hidden = true;

    const status = document.createElement("p");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp";
    fileInput.hidden = true;

    const changeButton = document.createElement("button");
    changeButton.type = "button";
    changeButton.textContent = "📷 Change Photo";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove Photo";

    let selectedFile = null;
    let removeExistingImage = false;
    let objectURL = null;

    if (post.image_url) {
        getImageURL(IMAGE_BUCKET, post.image_url).then(url => {
            if (url && !selectedFile && !removeExistingImage) {
                preview.src = url;
                preview.hidden = false;
            }
        });
    }

    changeButton.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            alert("Choose JPG, PNG or WebP.");
            fileInput.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be smaller than 10 MB.");
            fileInput.value = "";
            return;
        }

        selectedFile = file;
        removeExistingImage = false;

        if (objectURL) URL.revokeObjectURL(objectURL);

        objectURL = URL.createObjectURL(file);
        preview.src = objectURL;
        preview.hidden = false;
        status.textContent = "New photo selected.";
    });

    removeButton.addEventListener("click", () => {
        selectedFile = null;
        removeExistingImage = true;
        fileInput.value = "";
        preview.removeAttribute("src");
        preview.hidden = true;
        status.textContent = "Photo will be removed when saved.";
    });

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save Changes";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    const buttons = document.createElement("div");
    buttons.append(saveButton, cancelButton);

    editor.append(
        heading,
        textarea,
        changeButton,
        removeButton,
        fileInput,
        preview,
        status,
        buttons
    );

    card.appendChild(editor);

    cancelButton.addEventListener("click", () => {
        if (objectURL) URL.revokeObjectURL(objectURL);
        editor.remove();
    });

    saveButton.addEventListener("click", async () => {
        const newContent = textarea.value.trim();

        const hasImageAfterSave = selectedFile
            ? true
            : removeExistingImage
                ? false
                : Boolean(post.image_url);

        if (!newContent && !hasImageAfterSave) {
            alert("Moment cannot be empty.");
            return;
        }

        saveButton.disabled = true;
        cancelButton.disabled = true;
        saveButton.textContent = "Saving...";

        let newPath = null;

        try {
            let updatedImagePath = post.image_url;

            // UPLOAD NEW IMAGE
            if (selectedFile) {
                const extension =
                    selectedFile.type === "image/png" ? "png" :
                    selectedFile.type === "image/webp" ? "webp" : "jpg";

                newPath =
                    currentUser.id + "/" +
                    crypto.randomUUID() + "." + extension;

                const { error: uploadError } =
                    await supabaseClient.storage
                        .from(IMAGE_BUCKET)
                        .upload(newPath, selectedFile, {
                            cacheControl: "3600",
                            upsert: false,
                            contentType: selectedFile.type
                        });

                if (uploadError) throw uploadError;

                updatedImagePath = newPath;
            }

            if (removeExistingImage && !selectedFile) {
                updatedImagePath = null;
            }

            // UPDATE POST
            const { data, error } = await supabaseClient
                .from("posts")
                .update({
                    content: newContent,
                    image_url: updatedImagePath
                })
                .eq("id", post.id)
                .eq("user_id", currentUser.id)
                .select("id");

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error("Moment was not updated.");
            }

            // DELETE OLD IMAGE AFTER SUCCESSFUL UPDATE
            if (
                post.image_url &&
                (selectedFile || removeExistingImage) &&
                !post.image_url.startsWith("http") &&
                post.image_url.startsWith(currentUser.id + "/")
            ) {
                const { error: removeError } =
                    await supabaseClient.storage
                        .from(IMAGE_BUCKET)
                        .remove([post.image_url]);

                if (removeError) {
                    console.error("Old image cleanup error:", removeError);
                }
            }

            if (objectURL) URL.revokeObjectURL(objectURL);

            alert("Moment updated successfully!");
            await loadFeed();

        } catch (error) {
            if (newPath) {
                await supabaseClient.storage
                    .from(IMAGE_BUCKET)
                    .remove([newPath]);
            }

            console.error("Inline Edit Error:", error);
            alert(error.message || "Unable to update Moment.");

            saveButton.disabled = false;
            cancelButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });
}

// ======================================
// DELETE POST
// ======================================

async function deletePost(post) {
    if (!currentUser || post.user_id !== currentUser.id) {
        alert("You cannot delete this Moment.");
        return;
    }

    if (!confirm("Are you sure you want to delete this Moment?")) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("posts")
            .delete()
            .eq("id", post.id)
            .eq("user_id", currentUser.id)
            .select("id");

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error("Moment was not deleted.");
        }

        if (
            post.image_url &&
            !post.image_url.startsWith("http") &&
            post.image_url.startsWith(currentUser.id + "/")
        ) {
            const { error: storageError } =
                await supabaseClient.storage
                    .from(IMAGE_BUCKET)
                    .remove([post.image_url]);

            if (storageError) {
                console.error("Image cleanup error:", storageError);
            }
        }

        alert("Moment deleted successfully!");
        await loadFeed();

    } catch (error) {
        console.error("Delete Post Error:", error);
        alert(error.message || "Unable to delete Moment.");
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

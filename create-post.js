// ======================================
// VOLGAN - CREATE POST
// Image Compression + Supabase Storage
// ======================================

const createPostForm = document.getElementById("createPostForm");
const postContent = document.getElementById("postContent");
const characterCount = document.getElementById("characterCount");
const postPreview = document.getElementById("postPreview");
const publishButton = document.getElementById("publishButton");
const postMessage = document.getElementById("postMessage");

const postImageInput = document.getElementById("postImage");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const imageInfo = document.getElementById("imageInfo");
const removeImageButton = document.getElementById("removeImage");

const previewPostImage = document.getElementById("previewPostImage");
const previewUsername = document.getElementById("previewUsername");
const previewAvatar = document.getElementById("previewAvatar");

const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.78;

let currentUser = null;
let compressedImageBlob = null;
let originalImageName = "";
let previewObjectURL = null;
let isPublishing = false;

// ======================================
// MESSAGES
// ======================================

function showPostMessage(text, type = "error") {
    postMessage.textContent = text;
    postMessage.style.color =
        type === "success" ? "#087e8b" : "#dc2626";
}

// ======================================
// INITIALIZE
// ======================================

async function initializeCreatePost() {
    if (typeof supabaseClient === "undefined") {
        showPostMessage("Supabase connection failed. Check supabase.js.");
        publishButton.disabled = true;
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (!data.session) {
            window.location.replace("login.html");
            return;
        }

        currentUser = data.session.user;

        const metadata = currentUser.user_metadata || {};
        const username =
            metadata.username ||
            currentUser.email?.split("@")[0] ||
            "VOLGAN User";

        previewUsername.textContent = username;
        previewAvatar.textContent = username.charAt(0).toUpperCase();

    } catch (error) {
        console.error("VOLGAN session error:", error);
        showPostMessage("Unable to check login. Please try again.");
        publishButton.disabled = true;
    }
}

// ======================================
// CHARACTER COUNT + TEXT PREVIEW
// ======================================

postContent.addEventListener("input", function () {
    characterCount.textContent = postContent.value.length;

    postPreview.textContent =
        postContent.value.trim() || "Your post will appear here.";

    postMessage.textContent = "";
});

// ======================================
// IMAGE COMPRESSION
// ======================================

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const objectURL = URL.createObjectURL(file);
        const image = new Image();

        image.onload = function () {
            URL.revokeObjectURL(objectURL);
            resolve(image);
        };

        image.onerror = function () {
            URL.revokeObjectURL(objectURL);
            reject(new Error("Unable to open this image."));
        };

        image.src = objectURL;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Image compression failed."));
                }
            },
            type,
            quality
        );
    });
}

async function compressImage(file) {
    const image = await loadImage(file);

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    const largestSide = Math.max(width, height);

    if (largestSide > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / largestSide;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Your browser cannot process this image.");
    }

    context.drawImage(image, 0, 0, width, height);

    // JPEG is widely supported and generally compresses photos well.
    // PNG transparency may be lost during this conversion.
    return await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
}

// ======================================
// SELECT IMAGE
// ======================================

postImageInput.addEventListener("change", async function () {
    showPostMessage("");

    const file = postImageInput.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        showPostMessage("Choose a JPG, PNG or WebP image.");
        postImageInput.value = "";
        return;
    }

    if (file.size > MAX_ORIGINAL_SIZE) {
        showPostMessage("Original image must be 10 MB or smaller.");
        postImageInput.value = "";
        return;
    }

    publishButton.disabled = true;
    postImageInput.disabled = true;
    showPostMessage("Compressing image...", "success");

    try {
        const blob = await compressImage(file);

        // Release the previous preview URL.
        if (previewObjectURL) {
            URL.revokeObjectURL(previewObjectURL);
        }

        compressedImageBlob = blob;
        originalImageName = file.name;

        previewObjectURL = URL.createObjectURL(blob);

        imagePreview.src = previewObjectURL;
        previewPostImage.src = previewObjectURL;

        imagePreviewContainer.hidden = false;
        previewPostImage.hidden = false;

        const reduction = file.size > 0
            ? Math.max(0, (1 - blob.size / file.size) * 100)
            : 0;

        imageInfo.textContent =
            "Original: " + formatBytes(file.size) +
            " · Compressed: " + formatBytes(blob.size) +
            " · Size reduced: " + reduction.toFixed(0) + "%";

        showPostMessage("Image ready to publish.", "success");

    } catch (error) {
        console.error("Image compression error:", error);
        showPostMessage(error.message || "Unable to process image.");

        compressedImageBlob = null;
        originalImageName = "";
        imagePreviewContainer.hidden = true;
        previewPostImage.hidden = true;
        postImageInput.value = "";

    } finally {
        publishButton.disabled = false;
        postImageInput.disabled = false;
    }
});

// ======================================
// REMOVE IMAGE
// ======================================

removeImageButton.addEventListener("click", function () {
    postImageInput.value = "";
    compressedImageBlob = null;
    originalImageName = "";

    imagePreviewContainer.hidden = true;
    previewPostImage.hidden = true;

    imagePreview.removeAttribute("src");
    previewPostImage.removeAttribute("src");

    if (previewObjectURL) {
        URL.revokeObjectURL(previewObjectURL);
        previewObjectURL = null;
    }

    imageInfo.textContent = "";
    showPostMessage("Image removed.", "success");
});

// ======================================
// PUBLISH POST
// ======================================

createPostForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (isPublishing) return;

    if (!currentUser) {
        showPostMessage("Please log in before creating a post.");
        return;
    }

    const content = postContent.value.trim();

    if (!content && !compressedImageBlob) {
        showPostMessage("Write something or select an image.");
        return;
    }

    if (content.length > 2000) {
        showPostMessage("Post cannot exceed 2000 characters.");
        return;
    }

    isPublishing = true;
    publishButton.disabled = true;
    postImageInput.disabled = true;
    publishButton.textContent = "Publishing...";

    let uploadedPath = null;

    try {
        // Re-check session before saving.
        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError) throw sessionError;

        if (!sessionData.session) {
            currentUser = null;
            window.location.replace("login.html");
            return;
        }

        const user = sessionData.session.user;
        let imagePath = null;

        // Upload compressed image to Supabase Storage.
        if (compressedImageBlob) {
            const extension = "jpg";
            const uniqueName =
                crypto.randomUUID() + "." + extension;

            uploadedPath = user.id + "/" + uniqueName;

            const { error: uploadError } =
                await supabaseClient.storage
                    .from("post-images")
                    .upload(uploadedPath, compressedImageBlob, {
                        contentType: "image/jpeg",
                        cacheControl: "3600",
                        upsert: false
                    });

            if (uploadError) throw uploadError;

            imagePath = uploadedPath;
        }

        // Store the storage path, not a public URL.
        const { error: insertError } =
            await supabaseClient
                .from("posts")
                .insert({
                    user_id: user.id,
                    content: content,
                    image_url: imagePath
                });

        if (insertError) throw insertError;

        showPostMessage("Post published successfully!", "success");

        createPostForm.reset();
        characterCount.textContent = "0";
        postPreview.textContent = "Your post will appear here.";

        compressedImageBlob = null;
        originalImageName = "";
        imagePreviewContainer.hidden = true;
        previewPostImage.hidden = true;
        imageInfo.textContent = "";

        if (previewObjectURL) {
            URL.revokeObjectURL(previewObjectURL);
            previewObjectURL = null;
        }

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {
        console.error("VOLGAN publish error:", error);

        // If upload succeeded but the database insert failed,
        // remove the orphaned uploaded file.
        if (uploadedPath) {
            const { error: cleanupError } =
                await supabaseClient.storage
                    .from("post-images")
                    .remove([uploadedPath]);

            if (cleanupError) {
                console.error("Image cleanup failed:", cleanupError);
            }
        }

        showPostMessage(
            error.message || "Unable to publish. Please try again."
        );

    } finally {
        isPublishing = false;
        publishButton.disabled = false;
        postImageInput.disabled = false;
        publishButton.textContent = "Publish Post";
    }
});

// ======================================
// START
// ======================================

initializeCreatePost();
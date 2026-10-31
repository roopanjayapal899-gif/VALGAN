// ======================================
// VOLGAN - EDIT PROFILE
// ======================================

const editProfileForm = document.getElementById("editProfileForm");

const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const bioInput = document.getElementById("bio");

const profilePhotoInput = document.getElementById("profilePhoto");
const profilePreview = document.getElementById("profilePreview");

const bioCount = document.getElementById("bioCount");
const editMessage = document.getElementById("editMessage");

// Load saved profile data
const savedProfile = JSON.parse(
    localStorage.getItem("volganEditProfile") || "{}"
);

fullNameInput.value = savedProfile.fullName || "";
usernameInput.value = savedProfile.username || "";
bioInput.value = savedProfile.bio || "";

if (savedProfile.photo) {
    profilePreview.src = savedProfile.photo;
}

// Bio Character Counter
bioInput.addEventListener("input", () => {
    bioCount.textContent = bioInput.value.length + "/160";
});

// Profile Photo Preview
profilePhotoInput.addEventListener("change", () => {

    const file = profilePhotoInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        profilePhotoInput.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Image size must be below 2MB.");
        profilePhotoInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        profilePreview.src = event.target.result;
    };

    reader.readAsDataURL(file);
});

// Save Profile
editProfileForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const bio = bioInput.value.trim();

    if (!fullName || !username) {
        editMessage.style.color = "red";
        editMessage.textContent =
            "Name and username are required.";
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        editMessage.style.color = "red";
        editMessage.textContent =
            "Username can contain letters, numbers and underscore only.";
        return;
    }

    const saveProfile = (photo) => {

        const profileData = {
            fullName,
            username,
            bio,
            photo
        };

        localStorage.setItem(
            "volganEditProfile",
            JSON.stringify(profileData)
        );

        editMessage.style.color = "green";
        editMessage.textContent =
            "Profile saved successfully!";
    };

    const file = profilePhotoInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = (event) => {
            saveProfile(event.target.result);
        };

        reader.readAsDataURL(file);

    } else {
        saveProfile(savedProfile.photo || "");
    }

});
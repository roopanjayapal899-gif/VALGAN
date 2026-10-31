// ======================================
// VOLGAN - PRIVACY SETTINGS FRONTEND
// DEMO STORAGE ONLY
// ======================================

const privateAccount =
    document.getElementById("privateAccount");

const postVisibility =
    document.getElementById("postVisibility");

const allowRequests =
    document.getElementById("allowRequests");

const onlineStatus =
    document.getElementById("onlineStatus");

const lastActive =
    document.getElementById("lastActive");

const shareLocation =
    document.getElementById("shareLocation");

const savePrivacy =
    document.getElementById("savePrivacy");

const privacyMessage =
    document.getElementById("privacyMessage");


// ======================================
// LOAD DEMO SETTINGS
// ======================================

function loadPrivacySettings() {

    const saved = localStorage.getItem(
        "volgan_privacy_settings"
    );

    if (!saved) return;

    try {

        const settings = JSON.parse(saved);

        privateAccount.checked =
            settings.privateAccount ?? false;

        postVisibility.value =
            settings.postVisibility || "public";

        allowRequests.checked =
            settings.allowRequests ?? true;

        onlineStatus.checked =
            settings.onlineStatus ?? true;

        lastActive.checked =
            settings.lastActive ?? true;

        shareLocation.checked =
            settings.shareLocation ?? false;

    } catch (error) {

        console.error("Privacy settings error:", error);

    }
}


// ======================================
// SAVE SETTINGS
// ======================================

savePrivacy.addEventListener("click", () => {

    const settings = {

        privateAccount: privateAccount.checked,

        postVisibility: postVisibility.value,

        allowRequests: allowRequests.checked,

        onlineStatus: onlineStatus.checked,

        lastActive: lastActive.checked,

        shareLocation: shareLocation.checked

    };

    localStorage.setItem(
        "volgan_privacy_settings",
        JSON.stringify(settings)
    );

    privacyMessage.textContent =
        "Privacy settings saved on this device.";

    privacyMessage.style.color = "green";

});


// ======================================
// INITIALIZE
// ======================================

loadPrivacySettings();
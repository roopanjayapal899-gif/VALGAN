// ======================================
// VOLGAN - FEEDBACK SYSTEM
// ======================================

const feedbackForm = document.getElementById("feedbackForm");

const feedbackType = document.getElementById("feedbackType");
const feedbackRating = document.getElementById("feedbackRating");
const feedbackDetails = document.getElementById("feedbackDetails");

const feedbackCount = document.getElementById("feedbackCount");
const feedbackMessage = document.getElementById("feedbackMessage");

// Character Counter
feedbackDetails.addEventListener("input", () => {
    feedbackCount.textContent =
        feedbackDetails.value.length + "/1000";
});

// Submit Feedback
feedbackForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const type = feedbackType.value;
    const rating = feedbackRating.value;
    const details = feedbackDetails.value.trim();

    if (!type || !rating || !details) {
        feedbackMessage.style.color = "red";
        feedbackMessage.textContent =
            "Please complete all required fields.";
        return;
    }

    const feedback = {
        id: Date.now(),
        type: type,
        rating: rating,
        details: details,
        date: new Date().toISOString()
    };

    // Save feedback locally
    let feedbackList = JSON.parse(
        localStorage.getItem("volganFeedback") || "[]"
    );

    feedbackList.push(feedback);

    localStorage.setItem(
        "volganFeedback",
        JSON.stringify(feedbackList)
    );

    feedbackMessage.style.color = "green";
    feedbackMessage.textContent =
        "Thank you! Your feedback has been saved.";

    feedbackForm.reset();
    feedbackCount.textContent = "0/1000";

});
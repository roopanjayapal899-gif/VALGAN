// ======================================
// VOLGAN - HELP & SUPPORT
// ======================================

const faqItems = document.querySelectorAll(".faq-item");
const faqQuestions = document.querySelectorAll(".faq-question");
const helpSearch = document.getElementById("helpSearch");

// FAQ Open / Close
faqQuestions.forEach((button) => {

    button.addEventListener("click", () => {

        const currentItem = button.closest(".faq-item");

        // Close other FAQ items
        faqItems.forEach((item) => {
            if (item !== currentItem) {
                item.classList.remove("active");
                item.querySelector("span").textContent = "+";
            }
        });

        // Toggle current FAQ
        currentItem.classList.toggle("active");

        const icon = button.querySelector("span");

        icon.textContent = currentItem.classList.contains("active")
            ? "−"
            : "+";
    });

});

// Search FAQs
helpSearch.addEventListener("input", () => {

    const searchText = helpSearch.value.toLowerCase().trim();

    faqItems.forEach((item) => {

        const question = item.querySelector(".faq-question")
            .textContent.toLowerCase();

        const answer = item.querySelector(".faq-answer")
            .textContent.toLowerCase();

        if (
            question.includes(searchText) ||
            answer.includes(searchText)
        ) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
            item.classList.remove("active");
            item.querySelector("span").textContent = "+";
        }

    });

});
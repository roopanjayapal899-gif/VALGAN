// ======================================
// VOLGAN - REPORT SYSTEM
// ======================================

const reportForm = document.getElementById("reportForm");
const reportType = document.getElementById("reportType");
const reportDetails = document.getElementById("reportDetails");
const reportEmail = document.getElementById("reportEmail");
const reportMessage = document.getElementById("reportMessage");

reportForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const type = reportType.value;
    const details = reportDetails.value.trim();
    const email = reportEmail.value.trim();

    if (!type || !details) {
        reportMessage.style.color = "red";
        reportMessage.textContent = "Please fill in all required fields.";
        return;
    }

    const report = {
        id: Date.now(),
        type: type,
        details: details,
        email: email,
        date: new Date().toISOString()
    };

    // Save report locally (Frontend Demo)
    let reports = JSON.parse(
        localStorage.getItem("volganReports") || "[]"
    );

    reports.push(report);

    localStorage.setItem(
        "volganReports",
        JSON.stringify(reports)
    );

    reportMessage.style.color = "green";
    reportMessage.textContent =
        "Your report has been submitted successfully!";

    reportForm.reset();

});
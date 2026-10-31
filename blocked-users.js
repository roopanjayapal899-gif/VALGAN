// ======================================
// VOLGAN - BLOCKED USERS FRONTEND
// SAMPLE DATA ONLY
// ======================================

let blockedUsers = [
    {
        id: 1,
        name: "Test User",
        username: "@testuser"
    },
    {
        id: 2,
        name: "Sample Account",
        username: "@sample"
    }
];

const blockedList =
    document.getElementById("blockedList");

const blockedSearch =
    document.getElementById("blockedSearch");

const blockedCount =
    document.getElementById("blockedCount");


// ======================================
// CREATE ELEMENT
// ======================================

function createElement(tag, text, className = "") {

    const element = document.createElement(tag);

    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}


// ======================================
// RENDER BLOCKED USERS
// ======================================

function renderBlockedUsers() {

    blockedList.replaceChildren();

    const term = blockedSearch.value
        .trim()
        .toLowerCase();

    const filteredUsers = blockedUsers.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );

    blockedCount.textContent =
        `${blockedUsers.length} blocked users`;

    if (filteredUsers.length === 0) {

        blockedList.appendChild(
            createElement(
                "p",
                blockedUsers.length === 0
                    ? "You haven't blocked anyone yet."
                    : "No matching users found.",
                "empty-blocked"
            )
        );

        return;
    }

    filteredUsers.forEach(user => {

        const card = document.createElement("article");

        card.className = "blocked-card";

        const avatar = createElement(
            "div",
            "👤",
            "blocked-avatar"
        );

        const details = document.createElement("div");

        details.className = "blocked-details";

        details.append(
            createElement("h3", user.name),
            createElement("p", user.username)
        );

        const unblockButton = createElement(
            "button",
            "Unblock",
            "unblock-button"
        );

        unblockButton.type = "button";

        unblockButton.addEventListener("click", () => {

            const confirmed = confirm(
                `Unblock ${user.name}?`
            );

            if (!confirmed) return;

            blockedUsers = blockedUsers.filter(
                item => item.id !== user.id
            );

            renderBlockedUsers();

        });

        card.append(
            avatar,
            details,
            unblockButton
        );

        blockedList.appendChild(card);

    });

}


// ======================================
// SEARCH
// ======================================

blockedSearch.addEventListener(
    "input",
    renderBlockedUsers
);


// ======================================
// INITIALIZE
// ======================================

renderBlockedUsers();
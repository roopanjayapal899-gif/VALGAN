// ======================================
// VOLGAN - NOTIFICATIONS FRONTEND
// ======================================

// SAMPLE NOTIFICATIONS
// Supabase connection will be added later.

let notifications = [
    {
        id: 1,
        type: "friend_request",
        name: "Arun",
        message: "sent you a friend request.",
        icon: "👤",
        time: "2 minutes ago",
        read: false,
        action: true
    },
    {
        id: 2,
        type: "like",
        name: "Kumar",
        message: "liked your post.",
        icon: "❤️",
        time: "15 minutes ago",
        read: false,
        action: false
    },
    {
        id: 3,
        type: "comment",
        name: "Priya",
        message: "commented on your post.",
        icon: "💬",
        time: "1 hour ago",
        read: true,
        action: false
    },
    {
        id: 4,
        type: "friend_accepted",
        name: "Rahul",
        message: "accepted your friend request.",
        icon: "🤝",
        time: "Yesterday",
        read: true,
        action: false
    }
];

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");

const markAllRead =
    document.getElementById("markAllRead");

const tabs =
    document.querySelectorAll(".tab");

let currentFilter = "all";


// ======================================
// RENDER NOTIFICATIONS
// ======================================

function renderNotifications() {

    notificationList.replaceChildren();

    const unreadCount = notifications.filter(
        item => !item.read
    ).length;

    const filtered = notifications.filter(item => {

        if (currentFilter === "unread") {
            return !item.read;
        }

        return true;
    });

    notificationCount.textContent =
        `${notifications.length} Notifications · ${unreadCount} Unread`;

    if (filtered.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-message";

        empty.textContent =
            currentFilter === "unread"
                ? "No unread notifications."
                : "No notifications yet.";

        notificationList.appendChild(empty);

        return;
    }

    filtered.forEach(item => {

        const card = document.createElement("article");

        card.className =
            "notification-card" +
            (item.read ? "" : " unread");

        const icon = document.createElement("div");

        icon.className = "notification-icon";
        icon.textContent = item.icon;

        const content = document.createElement("div");

        content.className = "notification-content";

        const message = document.createElement("p");

        const strong = document.createElement("strong");

        strong.textContent = item.name;

        message.append(
            strong,
            document.createTextNode(" " + item.message)
        );

        const time = document.createElement("small");

        time.textContent = item.time;

        content.append(message, time);

        // FRIEND REQUEST ACTIONS

        if (item.type === "friend_request") {

            const actions = document.createElement("div");

            actions.className = "notification-actions";

            const accept = document.createElement("button");

            accept.textContent = "Accept";

            accept.addEventListener("click", () => {
                alert("Friend Request Backend will be connected later.");
            });

            const reject = document.createElement("button");

            reject.textContent = "Reject";

            reject.className = "secondary";

            reject.addEventListener("click", () => {

                item.read = true;
                item.action = false;

                renderNotifications();

            });

            actions.append(accept, reject);

            content.appendChild(actions);
        }

        // MARK AS READ

        if (!item.read) {

            const readButton = document.createElement("button");

            readButton.textContent = "Mark read";

            readButton.className = "secondary";

            readButton.addEventListener("click", () => {

                item.read = true;

                renderNotifications();

            });

            if (item.type !== "friend_request") {
                const actions = document.createElement("div");

                actions.className = "notification-actions";

                actions.appendChild(readButton);

                content.appendChild(actions);
            }
        }

        // DELETE

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-notification";

        deleteButton.textContent = "×";

        deleteButton.setAttribute(
            "aria-label",
            "Delete notification"
        );

        deleteButton.addEventListener("click", () => {

            notifications = notifications.filter(
                notification => notification.id !== item.id
            );

            renderNotifications();

        });

        card.append(icon, content, deleteButton);

        notificationList.appendChild(card);

    });
}


// ======================================
// FILTER TABS
// ======================================

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(button =>
            button.classList.remove("active")
        );

        tab.classList.add("active");

        currentFilter = tab.dataset.filter;

        renderNotifications();

    });

});


// ======================================
// MARK ALL AS READ
// ======================================

markAllRead.addEventListener("click", () => {

    notifications.forEach(item => {
        item.read = true;
    });

    renderNotifications();

});


// ======================================
// INITIALIZE
// ======================================

renderNotifications();
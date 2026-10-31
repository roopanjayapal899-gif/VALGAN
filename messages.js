// ======================================
// VOLGAN - MESSAGES FRONTEND
// SAMPLE DATA ONLY
// ======================================

const chatList = document.getElementById("chatList");
const chatSearch = document.getElementById("chatSearch");

const chatListSection =
    document.getElementById("chatListSection");

const chatWindow =
    document.getElementById("chatWindow");

const backButton =
    document.getElementById("backButton");

const chatUsername =
    document.getElementById("chatUsername");

const chatStatus =
    document.getElementById("chatStatus");

const messageList =
    document.getElementById("messageList");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

let activeChat = null;


// ======================================
// SAMPLE CONVERSATIONS
// ======================================

const conversations = [
    {
        id: 1,
        name: "Arun",
        username: "@arun",
        online: true,
        preview: "Hello! How are you?",
        time: "10:30 AM",
        messages: [
            {
                text: "Hi! Welcome to VOLGAN.",
                sent: false,
                time: "10:25 AM"
            },
            {
                text: "Hello! How are you?",
                sent: true,
                time: "10:30 AM"
            }
        ]
    },
    {
        id: 2,
        name: "Kumar",
        username: "@kumar",
        online: false,
        preview: "See you tomorrow!",
        time: "Yesterday",
        messages: [
            {
                text: "See you tomorrow!",
                sent: false,
                time: "Yesterday"
            }
        ]
    },
    {
        id: 3,
        name: "Priya",
        username: "@priya",
        online: true,
        preview: "Nice post!",
        time: "Yesterday",
        messages: [
            {
                text: "Nice post!",
                sent: false,
                time: "Yesterday"
            }
        ]
    }
];


// ======================================
// SAFE ELEMENT
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
// RENDER CHAT LIST
// ======================================

function renderChatList(searchTerm = "") {

    chatList.replaceChildren();

    const filtered = conversations.filter(chat =>
        chat.name.toLowerCase().includes(
            searchTerm.toLowerCase()
        )
    );

    if (filtered.length === 0) {
        chatList.appendChild(
            createElement(
                "p",
                "No conversations found.",
                "empty-chat"
            )
        );
        return;
    }

    filtered.forEach(chat => {

        const card = document.createElement("article");
        card.className = "chat-card";

        const avatar = createElement(
            "div",
            "👤",
            "avatar"
        );

        if (chat.online) {
            avatar.appendChild(
                createElement("span", "", "online-dot")
            );
        }

        const details = document.createElement("div");
        details.className = "chat-details";

        details.append(
            createElement("h3", chat.name),
            createElement("p", chat.preview)
        );

        const time = createElement(
            "small",
            chat.time,
            "chat-time"
        );

        card.append(avatar, details, time);

        card.addEventListener("click", () => {
            openChat(chat);
        });

        chatList.appendChild(card);
    });
}


// ======================================
// OPEN CHAT
// ======================================

function openChat(chat) {

    activeChat = chat;

    chatUsername.textContent = chat.name;

    chatStatus.textContent =
        chat.online ? "Online" : "Offline";

    chatListSection.hidden = true;
    chatWindow.hidden = false;

    renderMessages();
}


// ======================================
// RENDER MESSAGES
// ======================================

function renderMessages() {

    messageList.replaceChildren();

    if (!activeChat.messages.length) {
        messageList.appendChild(
            createElement(
                "p",
                "Start a conversation.",
                "empty-chat"
            )
        );
        return;
    }

    activeChat.messages.forEach(message => {

        const bubble = document.createElement("div");

        bubble.className =
            "message-bubble " +
            (message.sent ? "sent" : "received");

        bubble.appendChild(
            createElement("span", message.text)
        );

        bubble.appendChild(
            createElement("small", message.time)
        );

        messageList.appendChild(bubble);

    });

    messageList.scrollTop = messageList.scrollHeight;
}


// ======================================
// SEND MESSAGE - LOCAL DEMO
// ======================================

messageForm.addEventListener("submit", event => {

    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text || !activeChat) return;

    const now = new Date();

    const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    activeChat.messages.push({
        text: text,
        sent: true,
        time: time
    });

    activeChat.preview = text;
    activeChat.time = time;

    messageInput.value = "";

    renderMessages();

});


// ======================================
// BACK TO CHAT LIST
// ======================================

backButton.addEventListener("click", () => {

    chatWindow.hidden = true;
    chatListSection.hidden = false;

    activeChat = null;

    renderChatList(chatSearch.value);

});


// ======================================
// SEARCH CONVERSATIONS
// ======================================

chatSearch.addEventListener("input", () => {
    renderChatList(chatSearch.value);
});


// ======================================
// INITIALIZE
// ======================================

renderChatList();
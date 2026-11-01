
// ============================================
// VOLGAN - POSTCARD MESSAGING
// Supabase Private Messaging
// ============================================

let currentUser = null;
let activeChat = null;
let allMates = [];
let realtimeChannel = null;

const chatList = document.getElementById("chatList");
const chatSearch = document.getElementById("chatSearch");
const chatListSection = document.getElementById("chatListSection");
const chatWindow = document.getElementById("chatWindow");
const backButton = document.getElementById("backButton");
const chatUsername = document.getElementById("chatUsername");
const chatStatus = document.getElementById("chatStatus");
const messageList = document.getElementById("messageList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

// ============================================
// CHECK LOGIN
// ============================================

async function checkLogin() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("./login.html");
        return false;
    }

    currentUser = data.session.user;
    return true;
}

// ============================================
// GET PROFILES
// ============================================

async function getProfiles(userIds) {
    if (!userIds.length) return {};

    const uniqueIds = [...new Set(userIds)];

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, full_name, avatar_path")
        .in("id", uniqueIds);

    if (error) {
        console.error("Profile loading error:", error);
        return {};
    }

    const profileMap = {};

    (data || []).forEach(profile => {
        profileMap[profile.id] = profile;
    });

    return profileMap;
}

// ============================================
// GET AVATAR
// ============================================

async function getAvatar(path) {
    if (!path) return "";

    const { data, error } = await supabaseClient
        .storage
        .from("profile-images")
        .createSignedUrl(path, 3600);

    if (error) {
        console.error("Avatar error:", error);
        return "";
    }

    return data.signedUrl;
}

// ============================================
// LOAD ACCEPTED MATES
// ============================================

async function loadMates() {
    const { data, error } = await supabaseClient
        .from("friend_requests")
        .select("sender_id, receiver_id")
        .eq("status", "accepted")
        .or(
            `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        );

    if (error) {
        console.error("Mate loading error:", error);
        chatList.innerHTML =
            "<p class='empty-message'>Unable to load Mates.</p>";
        return;
    }

    const mateIds = (data || []).map(row =>
        row.sender_id === currentUser.id
            ? row.receiver_id
            : row.sender_id
    );

    const profiles = await getProfiles(mateIds);

    allMates = mateIds.map(id => ({
        id,
        profile: profiles[id] || {
            id,
            username: "Unknown Mate",
            full_name: "Unknown Mate"
        }
    }));

    await loadInbox();
}

// ============================================
// LOAD INBOX
// ============================================

async function loadInbox() {
    const { data, error } = await supabaseClient
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(
            `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        )
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Inbox error:", error);
        chatList.innerHTML =
            "<p class='empty-message'>Unable to load Postcards.</p>";
        return;
    }

    const latestMessages = {};

    (data || []).forEach(message => {
        const otherId =
            message.sender_id === currentUser.id
                ? message.receiver_id
                : message.sender_id;

        if (!latestMessages[otherId]) {
            latestMessages[otherId] = message;
        }
    });

    await renderChatList(latestMessages);
}

// ============================================
// RENDER CHAT LIST
// ============================================

async function renderChatList(latestMessages = {}) {
    chatList.innerHTML = "";

    const searchText =
        (chatSearch?.value || "").toLowerCase().trim();

    const filteredMates = allMates.filter(mate => {
        const name = mate.profile.full_name || "";
        const username = mate.profile.username || "";

        return (
            name.toLowerCase().includes(searchText) ||
            username.toLowerCase().includes(searchText)
        );
    });

    if (!filteredMates.length) {
        chatList.innerHTML =
            "<p class='empty-message'>No Mates found.</p>";
        return;
    }

    for (const mate of filteredMates) {
        const profile = mate.profile;

        const name =
            profile.full_name ||
            profile.username ||
            "Mate";

        const username = profile.username
            ? "@" + profile.username
            : "";

        const latest = latestMessages[mate.id];

        const card = document.createElement("div");
        card.className = "chat-card";

        const avatar = document.createElement("div");
        avatar.className = "chat-avatar";
        avatar.textContent = name.charAt(0).toUpperCase();

        if (profile.avatar_path) {
            const avatarUrl =
                await getAvatar(profile.avatar_path);

            if (avatarUrl) {
                avatar.textContent = "";
                avatar.style.backgroundImage =
                    `url("${avatarUrl}")`;
                avatar.style.backgroundSize = "cover";
                avatar.style.backgroundPosition = "center";
            }
        }

        const details = document.createElement("div");
        details.className = "chat-details";

        const nameElement = document.createElement("strong");
        nameElement.textContent = name;

        const usernameElement = document.createElement("small");
        usernameElement.textContent = username;

        const preview = document.createElement("p");
        preview.textContent = latest
            ? latest.content
            : "Start a Postcard 💌";

        details.append(
            nameElement,
            usernameElement,
            preview
        );

        card.append(avatar, details);

        card.addEventListener("click", () => {
            openChat(mate);
        });

        chatList.appendChild(card);
    }
}

// ============================================
// OPEN CHAT
// ============================================

async function openChat(mate) {
    activeChat = mate;

    chatListSection.hidden = true;
    chatWindow.hidden = false;

    chatUsername.textContent =
        mate.profile.full_name ||
        mate.profile.username ||
        "Mate";

    chatStatus.textContent = "Mate";

    await loadMessages();

    messageInput.focus();
}

// ============================================
// LOAD MESSAGES
// ============================================

async function loadMessages() {
    if (!activeChat || !currentUser) return;

    messageList.innerHTML =
        "<p class='empty-message'>Loading Postcards...</p>";

    const otherId = activeChat.id;

    const { data, error } = await supabaseClient
        .from("messages")
        .select(
            "id, sender_id, receiver_id, content, created_at"
        )
        .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Message loading error:", error);

        messageList.innerHTML =
            "<p class='empty-message'>Unable to load messages.</p>";

        return;
    }

    renderMessages(data || []);
}

// ============================================
// RENDER MESSAGES
// ============================================

function renderMessages(messages) {
    messageList.innerHTML = "";

    if (!messages.length) {
        messageList.innerHTML =
            "<p class='empty-message'>Send your first Postcard 💌</p>";
        return;
    }

    messages.forEach(message => {
        const messageElement =
            document.createElement("div");

        messageElement.className =
            message.sender_id === currentUser.id
                ? "message sent"
                : "message received";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = message.content;

        const time = document.createElement("small");
        time.className = "message-time";

        time.textContent =
            new Date(message.created_at).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        messageElement.append(bubble, time);
        messageList.appendChild(messageElement);
    });

    messageList.scrollTop = messageList.scrollHeight;
}

// ============================================
// SEND POSTCARD
// ============================================

messageForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (!activeChat || !currentUser) {
        alert("Please open a Mate conversation.");
        return;
    }

    const content = messageInput.value.trim();

    if (!content) return;

    if (content.length > 2000) {
        alert("Maximum 2000 characters allowed.");
        return;
    }

    if (activeChat.id === currentUser.id) {
        alert("You cannot send a Postcard to yourself.");
        return;
    }

    const sendButton =
        messageForm.querySelector("button");

    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

    const { data, error } = await supabaseClient
        .from("messages")
        .insert({
            sender_id: currentUser.id,
            receiver_id: activeChat.id,
            content: content
        })
        .select()
        .single();

    sendButton.disabled = false;
    sendButton.textContent = "Send";

    if (error) {
        console.error("POSTCARD SEND ERROR:", error);

        alert(
            "Message Failed!\n\n" +
            "Message: " + error.message + "\n\n" +
            "Code: " + error.code + "\n\n" +
            "Details: " + (error.details || "None") + "\n\n" +
            "Hint: " + (error.hint || "None")
        );

        return;
    }

    messageInput.value = "";

    await loadMessages();
    await loadInbox();

    messageInput.focus();
});

// ============================================
// BACK TO INBOX
// ============================================

backButton.addEventListener("click", function() {
    activeChat = null;

    chatWindow.hidden = true;
    chatListSection.hidden = false;

    loadInbox();
});

// ============================================
// SEARCH MATES
// ============================================

chatSearch.addEventListener("input", function() {
    loadInbox();
});

// ============================================
// REALTIME MESSAGING
// ============================================

function startRealtime() {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabaseClient
        .channel("volgan-postcard-" + currentUser.id)

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `receiver_id=eq.${currentUser.id}`
            },
            async payload => {
                if (
                    activeChat &&
                    (
                        payload.new.sender_id === activeChat.id ||
                        payload.new.receiver_id === activeChat.id
                    )
                ) {
                    await loadMessages();
                }

                await loadInbox();
            }
        )

        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `sender_id=eq.${currentUser.id}`
            },
            async payload => {
                if (
                    activeChat &&
                    (
                        payload.new.sender_id === activeChat.id ||
                        payload.new.receiver_id === activeChat.id
                    )
                ) {
                    await loadMessages();
                }

                await loadInbox();
            }
        )

        .subscribe(status => {
            console.log("Postcard Realtime Status:", status);
        });
}

// ============================================
// INITIALIZE POSTCARD
// ============================================

async function initPostcard() {
    const loggedIn = await checkLogin();

    if (!loggedIn) return;

    await loadMates();

    startRealtime();

    const params =
        new URLSearchParams(window.location.search);

    const userId = params.get("user_id");

    if (userId) {
        const mate = allMates.find(
            item => item.id === userId
        );

        if (mate) {
            await openChat(mate);
        }
    }
}

initPostcard();

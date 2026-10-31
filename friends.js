// ======================================
// VOLGAN - FRIENDS SYSTEM V1
// ======================================

const userSearch = document.getElementById("userSearch");
const searchButton = document.getElementById("searchButton");

const usersContainer = document.getElementById("usersContainer");
const requestsContainer = document.getElementById("requestsContainer");
const myFriendsContainer = document.getElementById("myFriendsContainer");

const friendsMessage = document.getElementById("friendsMessage");

let currentUser = null;


// ======================================
// MESSAGE
// ======================================

function showMessage(message) {
    friendsMessage.textContent = message;
}


// ======================================
// SAFE ELEMENT
// ======================================

function createTextElement(tag, text, className = "") {
    const element = document.createElement(tag);

    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}


// ======================================
// BUTTON
// ======================================

function createButton(text, callback) {
    const button = createTextElement("button", text);

    button.type = "button";
    button.addEventListener("click", callback);

    return button;
}


// ======================================
// LOGIN CHECK
// ======================================

async function checkLogin() {
    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "login.html";
        return false;
    }

    currentUser = data.user;

    return true;
}


// ======================================
// LOAD PROFILE DATA
// ======================================

async function getProfiles(userIds) {
    if (!userIds.length) return [];

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);

    if (error) {
        console.error("Profiles error:", error);
        return [];
    }

    return data || [];
}


// ======================================
// USER CARD
// ======================================

function createUserCard(user, actionButton = null) {
    const card = document.createElement("article");
    card.className = "user-card";

    const avatar = createTextElement(
        "div",
        "👤",
        "user-avatar"
    );

    const details = document.createElement("div");
    details.className = "user-details";

    details.appendChild(
        createTextElement(
            "h3",
            user.full_name || "VOLGAN User"
        )
    );

    details.appendChild(
        createTextElement(
            "p",
            "@" + (user.username || "user")
        )
    );

    card.append(avatar, details);

    if (actionButton) {
        const actions = document.createElement("div");
        actions.className = "user-actions";

        actions.appendChild(actionButton);

        card.appendChild(actions);
    }

    return card;
}


// ======================================
// SEARCH PEOPLE
// ======================================

async function searchUsers() {
    const term = userSearch.value.trim();

    usersContainer.replaceChildren();

    if (term.length < 2) {
        usersContainer.appendChild(
            createTextElement(
                "p",
                "Enter at least 2 characters."
            )
        );
        return;
    }

    showMessage("Searching people...");

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, full_name")
        .ilike("username", `%${term}%`)
        .neq("id", currentUser.id)
        .limit(20);

    if (error) {
        console.error(error);
        showMessage("User search failed.");
        return;
    }

    if (!data || data.length === 0) {
        showMessage("No users found.");
        return;
    }

    for (const user of data) {
        const button = createButton(
            "Add Friend",
            () => sendFriendRequest(user.id, button)
        );

        usersContainer.appendChild(
            createUserCard(user, button)
        );
    }

    showMessage(`${data.length} people found.`);
}


// ======================================
// SEND FRIEND REQUEST
// ======================================

async function sendFriendRequest(receiverId, button) {
    button.disabled = true;
    button.textContent = "Sending...";

    const { error } = await supabaseClient
        .from("friend_requests")
        .insert({
            sender_id: currentUser.id,
            receiver_id: receiverId,
            status: "pending"
        });

    if (error) {
        console.error("Friend request error:", error);

        button.textContent = "Add Friend";
        button.disabled = false;

        showMessage(
            "Request failed. It may already exist."
        );

        return;
    }

    button.textContent = "Request Sent";

    showMessage("Friend request sent!");
}


// ======================================
// LOAD FRIEND REQUESTS
// ======================================

async function loadRequests() {
    requestsContainer.replaceChildren();

    const { data, error } = await supabaseClient
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .eq("receiver_id", currentUser.id)
        .eq("status", "pending");

    if (error) {
        console.error("Requests error:", error);

        requestsContainer.appendChild(
            createTextElement(
                "p",
                "Could not load requests."
            )
        );

        return;
    }

    if (!data || data.length === 0) {
        requestsContainer.appendChild(
            createTextElement(
                "p",
                "No pending friend requests."
            )
        );

        return;
    }

    const profiles = await getProfiles(
        data.map(request => request.sender_id)
    );

    const profileMap = new Map(
        profiles.map(profile => [profile.id, profile])
    );

    for (const request of data) {
        const user = profileMap.get(request.sender_id);

        if (!user) continue;

        const actions = document.createElement("div");

        const acceptButton = createButton(
            "Accept",
            () => updateRequest(request.id, "accepted")
        );

        const rejectButton = createButton(
            "Reject",
            () => updateRequest(request.id, "rejected")
        );

        actions.append(acceptButton, rejectButton);

        const card = createUserCard(user, actions);

        requestsContainer.appendChild(card);
    }
}


// ======================================
// ACCEPT / REJECT REQUEST
// ======================================

async function updateRequest(requestId, status) {
    const { error } = await supabaseClient
        .from("friend_requests")
        .update({ status: status })
        .eq("id", requestId);

    if (error) {
        console.error("Update request error:", error);

        showMessage(
            "Could not update friend request."
        );

        return;
    }

    showMessage(
        status === "accepted"
            ? "Friend request accepted!"
            : "Friend request rejected."
    );

    await loadRequests();
    await loadFriends();
}


// ======================================
// LOAD MY FRIENDS
// ======================================

async function loadFriends() {
    myFriendsContainer.replaceChildren();

    const { data, error } = await supabaseClient
        .from("friend_requests")
        .select("id, sender_id, receiver_id")
        .eq("status", "accepted")
        .or(
            `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        );

    if (error) {
        console.error("Friends error:", error);

        myFriendsContainer.appendChild(
            createTextElement(
                "p",
                "Could not load friends."
            )
        );

        return;
    }

    if (!data || data.length === 0) {
        myFriendsContainer.appendChild(
            createTextElement(
                "p",
                "You have no friends yet."
            )
        );

        return;
    }

    const friendIds = data.map(request =>
        request.sender_id === currentUser.id
            ? request.receiver_id
            : request.sender_id
    );

    const profiles = await getProfiles(friendIds);

    for (const friend of profiles) {
        const viewButton = createButton(
            "View Profile",
            () => {
                window.location.href =
                    "view-profile.html?id=" +
                    encodeURIComponent(friend.id);
            }
        );

        myFriendsContainer.appendChild(
            createUserCard(friend, viewButton)
        );
    }
}


// ======================================
// BUTTON EVENTS
// ======================================

searchButton.addEventListener(
    "click",
    searchUsers
);

userSearch.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchUsers();
    }
});


// ======================================
// INITIALIZE
// ======================================

async function initializeFriendsPage() {
    const loggedIn = await checkLogin();

    if (!loggedIn) return;

    await loadRequests();
    await loadFriends();

    usersContainer.appendChild(
        createTextElement(
            "p",
            "Search for people by username."
        )
    );
}

initializeFriendsPage();
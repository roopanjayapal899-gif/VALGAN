// ======================================
// VOLGAN SEARCH ENGINE
// ======================================

const peopleTab = document.getElementById("peopleTab");
const postsTab = document.getElementById("postsTab");

const peopleSection = document.getElementById("peopleSearchSection");
const postsSection = document.getElementById("postsSearchSection");

const peopleInput = document.getElementById("peopleSearchInput");
const postsInput = document.getElementById("postsSearchInput");

const peopleButton = document.getElementById("peopleSearchButton");
const postsButton = document.getElementById("postsSearchButton");

const peopleResults = document.getElementById("peopleResults");
const postsResults = document.getElementById("postsResults");

const searchMessage = document.getElementById("searchMessage");

let currentUser = null;


// ======================================
// MESSAGE
// ======================================

function showSearchMessage(message) {
    searchMessage.textContent = message;
}


// ======================================
// SAFE HTML ELEMENT
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
// LOGIN CHECK
// ======================================

async function checkSearchLogin() {

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
// SWITCH SEARCH TABS
// ======================================

peopleTab.addEventListener("click", () => {

    peopleTab.classList.add("active");
    postsTab.classList.remove("active");

    peopleSection.hidden = false;
    postsSection.hidden = true;

    showSearchMessage("");
});


postsTab.addEventListener("click", () => {

    postsTab.classList.add("active");
    peopleTab.classList.remove("active");

    postsSection.hidden = false;
    peopleSection.hidden = true;

    showSearchMessage("");
});


// ======================================
// PEOPLE SEARCH
// ======================================

async function searchPeople() {

    const term = peopleInput.value.trim();

    peopleResults.replaceChildren();

    if (term.length < 2) {

        peopleResults.appendChild(
            createElement(
                "p",
                "Enter at least 2 characters."
            )
        );

        return;
    }

    showSearchMessage("Searching people...");

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, username, full_name")
        .ilike("username", `%${term}%`)
        .neq("id", currentUser.id)
        .limit(20);

    if (error) {

        console.error(error);

        showSearchMessage("People search failed.");

        return;
    }

    if (!data || data.length === 0) {

        peopleResults.appendChild(
            createElement("p", "No people found.")
        );

        showSearchMessage("");

        return;
    }

    data.forEach(user => {

        const card = document.createElement("article");

        card.className = "user-card";

        const avatar = createElement(
            "div",
            "👤",
            "user-avatar"
        );

        const details = document.createElement("div");

        details.className = "user-details";

        details.appendChild(
            createElement(
                "h3",
                user.full_name || "VOLGAN User"
            )
        );

        details.appendChild(
            createElement(
                "p",
                "@" + user.username
            )
        );

        // Make profile card clickable
const profileLink = document.createElement("a");

profileLink.href =
    "view-profile.html?id=" +
    encodeURIComponent(user.id);

profileLink.className = "user-card-link";

profileLink.style.textDecoration = "none";
profileLink.style.color = "inherit";
profileLink.style.display = "block";

card.append(avatar, details);

profileLink.appendChild(card);

peopleResults.appendChild(profileLink);

    });

    showSearchMessage(`${data.length} people found.`);
}


// ======================================
// POST SEARCH
// ======================================

async function searchPosts() {

    const term = postsInput.value.trim();

    postsResults.replaceChildren();

    if (term.length < 2) {

        postsResults.appendChild(
            createElement(
                "p",
                "Enter at least 2 characters."
            )
        );

        return;
    }

    showSearchMessage("Searching posts...");

    const { data: posts, error } = await supabaseClient
        .from("posts")
        .select("id, user_id, content, image_url, created_at")
        .ilike("content", `%${term}%`)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {

        console.error(error);

        showSearchMessage(
            "Post search failed. Check database permissions."
        );

        return;
    }

    if (!posts || posts.length === 0) {

        postsResults.appendChild(
            createElement("p", "No matching posts found.")
        );

        showSearchMessage("");

        return;
    }

    // Get post authors
    const userIds = [
        ...new Set(posts.map(post => post.user_id))
    ];

    const { data: profiles, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("id, username, full_name")
            .in("id", userIds);

    if (profileError) {
        console.error(profileError);
    }

    const profileMap = new Map(
        (profiles || []).map(profile => [
            profile.id,
            profile
        ])
    );

    // Display posts
    for (const post of posts) {

        const card = document.createElement("article");

        card.className = "post-card";

        const author = profileMap.get(post.user_id);

        const authorName =
            author?.full_name ||
            author?.username ||
            "VOLGAN User";

        card.appendChild(
            createElement(
                "div",
                "👤 " + authorName,
                "post-author"
            )
        );

        card.appendChild(
            createElement(
                "p",
                post.content || "",
                "post-content"
            )
        );

        // Private storage image
        if (post.image_url) {

            const { data: imageData, error: imageError } =
                await supabaseClient.storage
                    .from("post-images")
                    .createSignedUrl(post.image_url, 3600);

            if (!imageError && imageData?.signedUrl) {

                const image = document.createElement("img");

                image.src = imageData.signedUrl;

                image.alt = "Post image";

                image.className = "post-image";

                image.loading = "lazy";

                card.appendChild(image);
            }
        }

        const date = new Date(post.created_at);

        card.appendChild(
            createElement(
                "small",
                date.toLocaleString(),
            )
        );

        postsResults.appendChild(card);
    }

    showSearchMessage(`${posts.length} posts found.`);
}


// ======================================
// BUTTON EVENTS
// ======================================

peopleButton.addEventListener(
    "click",
    searchPeople
);

postsButton.addEventListener(
    "click",
    searchPosts
);


// ======================================
// ENTER KEY SEARCH
// ======================================

peopleInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchPeople();
    }

});


postsInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchPosts();
    }

});


// ======================================
// INITIALIZE
// ======================================

async function initializeSearch() {

    const loggedIn = await checkSearchLogin();

    if (!loggedIn) return;

    peopleResults.replaceChildren(
        createElement("p", "Search for people on VOLGAN.")
    );

    postsResults.replaceChildren(
        createElement("p", "Discover interesting posts.")
    );
}

initializeSearch();
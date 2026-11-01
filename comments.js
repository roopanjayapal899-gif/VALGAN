
// ======================================
// VOLGAN - WHISPER SYSTEM
// COMMENT + GLOBE LIKE + REPLY
// EDIT + DELETE
// ======================================

const postAuthor = document.getElementById("postAuthor");
const postContent = document.getElementById("postContent");

const likeButton = document.getElementById("likeButton");
const likeCount = document.getElementById("likeCount");

const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentMessage = document.getElementById("commentMessage");

const whisperTemplate = document.getElementById("whisperTemplate");

let currentUser = null;
let currentPost = null;
let allComments = [];
let currentPostLikes = [];
let postLiked = false;

const postId = new URLSearchParams(window.location.search)
    .get("post_id");


// ======================================
// INITIALIZE
// ======================================

async function initializeWhisper() {
    try {
        if (!postId) {
            throw new Error("Moment ID is missing.");
        }

        if (typeof supabaseClient === "undefined") {
            throw new Error("Supabase connection failed.");
        }

        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError) throw sessionError;

        if (!sessionData.session) {
            window.location.replace("login.html");
            return;
        }

        currentUser = sessionData.session.user;

        await loadOriginalMoment();
        await loadPostLikes();
        await loadWhispers();

    } catch (error) {
        console.error("Whisper Initialization Error:", error);
        showMessage(error.message);
    }
}


// ======================================
// LOAD ORIGINAL MOMENT
// ======================================

async function loadOriginalMoment() {
    const { data, error } = await supabaseClient
        .from("posts")
        .select("id, user_id, content, created_at")
        .eq("id", postId)
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        throw new Error("Moment not found.");
    }

    currentPost = data;

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("full_name, username")
            .eq("id", data.user_id)
            .maybeSingle();

    if (profileError) throw profileError;

    const metadata =
        data.user_id === currentUser.id
            ? currentUser.user_metadata || {}
            : {};

    postAuthor.textContent =
        profile?.full_name ||
        metadata.full_name ||
        metadata.name ||
        profile?.username ||
        "VOLGAN User";

    postContent.textContent = data.content || "";
}


// ======================================
// LOAD POST WANDER
// ======================================

async function loadPostLikes() {
    const { data, error } = await supabaseClient
        .from("post_likes")
        .select("user_id")
        .eq("post_id", postId);

    if (error) throw error;

    currentPostLikes = data || [];

    postLiked = currentPostLikes.some(
        row => row.user_id === currentUser.id
    );

    likeCount.textContent =
        currentPostLikes.length + " Wander";

    likeButton.textContent =
        postLiked ? "🌍 Wandered" : "🌍 Wander";
}


// ======================================
// TOGGLE POST WANDER
// ======================================

likeButton.addEventListener("click", async () => {
    likeButton.disabled = true;

    try {
        if (postLiked) {
            const { error } = await supabaseClient
                .from("post_likes")
                .delete()
                .eq("post_id", postId)
                .eq("user_id", currentUser.id);

            if (error) throw error;

        } else {
            const { error } = await supabaseClient
                .from("post_likes")
                .insert({
                    post_id: postId,
                    user_id: currentUser.id
                });

            if (error) throw error;
        }

        await loadPostLikes();

    } catch (error) {
        console.error("Wander Error:", error);
        showMessage(error.message);

    } finally {
        likeButton.disabled = false;
    }
});


// ======================================
// LOAD WHISPERS
// ======================================

async function loadWhispers() {
    const { data, error } = await supabaseClient
        .from("comments")
        .select("id, post_id, user_id, content, parent_id, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    allComments = data || [];

    const userIds = [
        ...new Set(allComments.map(comment => comment.user_id))
    ];

    let profiles = [];

    if (userIds.length > 0) {
        const { data: profileData, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("id, full_name, username")
                .in("id", userIds);

        if (profileError) throw profileError;

        profiles = profileData || [];
    }

    const profileMap = new Map(
        profiles.map(profile => [profile.id, profile])
    );

    const commentIds = allComments.map(comment => comment.id);

    let commentLikes = [];

    if (commentIds.length > 0) {
        const { data: likeData, error: likeError } =
            await supabaseClient
                .from("comment_likes")
                .select("comment_id, user_id")
                .in("comment_id", commentIds);

        if (likeError) throw likeError;

        commentLikes = likeData || [];
    }

    renderWhispers(profileMap, commentLikes);
}


// ======================================
// RENDER WHISPERS + REPLIES
// ======================================

function renderWhispers(profileMap, commentLikes) {
    commentsList.replaceChildren();

    const topLevel = allComments.filter(
        comment => !comment.parent_id
    );

    if (topLevel.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-whispers";
        empty.textContent = "No Whispers yet. Be the first!";
        commentsList.appendChild(empty);
    }

    topLevel.forEach(comment => {
        const card = createWhisperCard(
            comment,
            profileMap,
            commentLikes
        );

        commentsList.appendChild(card);

        const replies = allComments.filter(
            item => item.parent_id === comment.id
        );

        replies.forEach(reply => {
            const replyCard = createWhisperCard(
                reply,
                profileMap,
                commentLikes,
                true
            );

            replyCard.style.marginLeft = "25px";
            commentsList.appendChild(replyCard);
        });
    });

    commentMessage.textContent =
        allComments.length + " Whispers";
}


// ======================================
// CREATE WHISPER CARD
// ======================================

function createWhisperCard(
    comment,
    profileMap,
    commentLikes,
    isReply = false
) {
    const fragment = whisperTemplate.content.cloneNode(true);

    const card = fragment.querySelector(".whisper-card");

    const author = card.querySelector(".whisper-author");
    const content = card.querySelector(".whisper-content");

    const globeButton =
        card.querySelector(".whisper-globe-button");

    const globeCount =
        card.querySelector(".whisper-like-count");

    const replyButton =
        card.querySelector(".whisper-reply-button");

    const menuButton =
        card.querySelector(".whisper-menu-button");

    const profile = profileMap.get(comment.user_id);

    const name =
        comment.user_id === currentUser.id
            ? (
                currentUser.user_metadata?.full_name ||
                currentUser.user_metadata?.name ||
                profile?.full_name ||
                profile?.username
            )
            : (profile?.full_name || profile?.username);

    author.textContent = name || "VOLGAN User";
    content.textContent = comment.content;

    const likes = commentLikes.filter(
        row => row.comment_id === comment.id
    );

    const isLiked = likes.some(
        row => row.user_id === currentUser.id
    );

    globeButton.textContent = isLiked ? "🌍" : "🌐";
    globeCount.textContent = likes.length;

    if (isLiked) {
        globeButton.style.color = "#6555d8";
    }

    globeButton.addEventListener("click", async () => {
        globeButton.disabled = true;

        try {
            if (isLiked) {
                const { error } = await supabaseClient
                    .from("comment_likes")
                    .delete()
                    .eq("comment_id", comment.id)
                    .eq("user_id", currentUser.id);

                if (error) throw error;

            } else {
                const { error } = await supabaseClient
                    .from("comment_likes")
                    .insert({
                        comment_id: comment.id,
                        user_id: currentUser.id
                    });

                if (error) throw error;
            }

            await loadWhispers();

        } catch (error) {
            showMessage(error.message);
            globeButton.disabled = false;
        }
    });

    // REPLY
    replyButton.addEventListener("click", () => {
        showReplyInput(comment.id, card);
    });

    // EDIT / DELETE
    if (comment.user_id === currentUser.id) {
        menuButton.addEventListener("click", () => {
            showCommentMenu(comment);
        });
    } else {
        menuButton.hidden = true;
    }

    return card;
}


// ======================================
// ADD WHISPER
// ======================================

commentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const content = commentInput.value.trim();

    if (!content) return;

    const sendButton = commentForm.querySelector("button");
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";

    try {
        const { error } = await supabaseClient
            .from("comments")
            .insert({
                post_id: postId,
                user_id: currentUser.id,
                content: content,
                parent_id: null
            });

        if (error) throw error;

        commentInput.value = "";
        await loadWhispers();

    } catch (error) {
        showMessage(error.message);

    } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Send";
    }
});


// ======================================
// REPLY INPUT
// ======================================

function showReplyInput(parentId, card) {
    if (card.querySelector(".whisper-reply-input")) return;

    const input = document.createElement("input");
    input.className = "whisper-reply-input";
    input.placeholder = "Write a reply...";
    input.maxLength = 500;

    const send = document.createElement("button");
    send.type = "button";
    send.textContent = "Reply";

    const wrapper = document.createElement("div");
    wrapper.append(input, send);

    card.appendChild(wrapper);

    send.addEventListener("click", async () => {
        const content = input.value.trim();

        if (!content) return;

        send.disabled = true;

        try {
            const { error } = await supabaseClient
                .from("comments")
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    content,
                    parent_id: parentId
                });

            if (error) throw error;

            await loadWhispers();

        } catch (error) {
            showMessage(error.message);
            send.disabled = false;
        }
    });
}


// ======================================
// COMMENT MENU
// ======================================

function showCommentMenu(comment) {
    const choice = prompt(
        "1 = Edit Whisper\n2 = Delete Whisper"
    );

    if (choice === "1") {
        editWhisper(comment);
    }

    if (choice === "2") {
        deleteWhisper(comment);
    }
}


// ======================================
// EDIT WHISPER
// ======================================

async function editWhisper(comment) {
    const newContent = prompt(
        "Edit your Whisper:",
        comment.content
    );

    if (newContent === null) return;

    if (!newContent.trim()) {
        alert("Whisper cannot be empty.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from("comments")
            .update({
                content: newContent.trim()
            })
            .eq("id", comment.id)
            .eq("user_id", currentUser.id);

        if (error) throw error;

        await loadWhispers();

    } catch (error) {
        showMessage(error.message);
    }
}


// ======================================
// DELETE WHISPER
// ======================================

async function deleteWhisper(comment) {
    if (!confirm("Delete this Whisper?")) return;

    try {
        const { error } = await supabaseClient
            .from("comments")
            .delete()
            .eq("id", comment.id)
            .eq("user_id", currentUser.id);

        if (error) throw error;

        await loadWhispers();

    } catch (error) {
        showMessage(error.message);
    }
}


// ======================================
// MESSAGE HELPER
// ======================================

function showMessage(message) {
    if (commentMessage) {
        commentMessage.textContent = message;
    }

    console.error(message);
}


// ======================================
// START
// ======================================

initializeWhisper();

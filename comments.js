// ======================================
// VOLGAN - COMMENTS FRONTEND
// SAMPLE DATA ONLY
// ======================================

const likeButton = document.getElementById("likeButton");
const likeCount = document.getElementById("likeCount");

const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentMessage = document.getElementById("commentMessage");

let liked = false;
let likes = 12;

let comments = [
    {
        id: 1,
        name: "Arun",
        text: "Nice post!",
        time: "10 minutes ago"
    },
    {
        id: 2,
        name: "Kumar",
        text: "Great work!",
        time: "20 minutes ago"
    }
];

let nextCommentId = 3;


// ======================================
// LIKE SYSTEM - DEMO
// ======================================

function renderLikes() {
    likeButton.textContent = liked ? "♥ Liked" : "♡ Like";
    likeButton.classList.toggle("liked", liked);
    likeCount.textContent = `${likes} Likes`;
}

likeButton.addEventListener("click", () => {

    liked = !liked;

    likes += liked ? 1 : -1;

    renderLikes();

});


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
// RENDER COMMENTS
// ======================================

function renderComments() {

    commentsList.replaceChildren();

    if (comments.length === 0) {

        commentsList.appendChild(
            createElement(
                "p",
                "No comments yet. Start the conversation!",
                "empty-comments"
            )
        );

        return;
    }

    comments.forEach(comment => {

        const card = document.createElement("article");
        card.className = "comment-card";

        const avatar = createElement(
            "div",
            "👤",
            "comment-avatar"
        );

        const content = document.createElement("div");
        content.className = "comment-content";

        content.append(
            createElement("strong", comment.name),
            createElement("p", comment.text),
            createElement("small", comment.time)
        );

        const deleteButton = createElement(
            "button",
            "Delete",
            "delete-comment"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {

            const confirmed = confirm("Delete this demo comment?");

            if (!confirmed) return;

            comments = comments.filter(
                item => item.id !== comment.id
            );

            renderComments();

        });

        card.append(avatar, content, deleteButton);

        commentsList.appendChild(card);

    });

}


// ======================================
// ADD COMMENT - DEMO
// ======================================

commentForm.addEventListener("submit", event => {

    event.preventDefault();

    const text = commentInput.value.trim();

    if (!text) return;

    comments.unshift({
        id: nextCommentId++,
        name: "VOLGAN User",
        text: text,
        time: new Date().toLocaleString()
    });

    commentInput.value = "";

    commentMessage.textContent = "Comment added.";

    renderComments();

});


// ======================================
// INITIALIZE
// ======================================

renderLikes();
renderComments();
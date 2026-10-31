// ======================================
// VOLGAN - SAVED POSTS
// ======================================

const savedPostsContainer = document.getElementById("savedPostsContainer");

// Get saved posts
let savedPosts = JSON.parse(
    localStorage.getItem("volganSavedPosts") || "[]"
);

// Save to localStorage
function updateSavedPosts() {
    localStorage.setItem(
        "volganSavedPosts",
        JSON.stringify(savedPosts)
    );
}

// Display saved posts
function displaySavedPosts() {

    savedPostsContainer.innerHTML = "";

    if (savedPosts.length === 0) {
        savedPostsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔖</div>
                <h3>No Saved Posts Yet</h3>
                <p>Posts you save will appear here.</p>
                <a href="index.html">Explore Posts</a>
            </div>
        `;
        return;
    }

    savedPosts.forEach((post, index) => {

        const postCard = document.createElement("div");
        postCard.className = "saved-post";

        const content = document.createElement("p");
        content.textContent = post.content || "Saved post";

        const removeButton = document.createElement("button");
        removeButton.className = "remove-saved";
        removeButton.textContent = "Remove Bookmark";

        removeButton.addEventListener("click", () => {
            removeSavedPost(index);
        });

        postCard.appendChild(content);
        postCard.appendChild(removeButton);

        savedPostsContainer.appendChild(postCard);
    });
}

// Remove saved post
function removeSavedPost(index) {

    savedPosts.splice(index, 1);

    updateSavedPosts();
    displaySavedPosts();
}

// Initial display
displaySavedPosts();
/* =====================================================
   VOLGAN — World Feed
   Compatible with the supplied index.html
   Requires supabase.js to define `supabaseClient`.
   ===================================================== */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const userAvatar = $("userAvatar");
  const feedContainer = $("feedContainer");
  const feedFilter = $("feedFilter");
  const createPostButton = $("createPostButton");
  const textPostButton = $("textPostButton");

  const IMAGE_BUCKET = "post-images";
  const PROFILE_BUCKET = "profile-images";
  let currentUser = null;
  let profilesById = new Map();
  let mateRowsByUserId = new Map();
  let loadingFeed = false;

  function setFeedMessage(message) {
    if (!feedContainer) return;
    const p = document.createElement("p");
    p.className = "feed-message";
    p.textContent = message;
    feedContainer.replaceChildren(p);
  }

  function goToCreatePost() {
    window.location.href = "create-post.html";
  }

  function openProfile(userId) {
    if (!userId || !currentUser) return;
    if (userId === currentUser.id) {
      window.location.href = "profile.html";
      return;
    }
    window.location.href = `view-profile.html?user_id=${encodeURIComponent(userId)}`;
  }

  function getDisplayName(userId) {
    const profile = profilesById.get(userId);
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    if (userId === currentUser?.id) {
      const meta = currentUser.user_metadata || {};
      return meta.full_name || meta.name || meta.username || "You";
    }
    return "VOLGAN User";
  }

  function initials(name) {
    return (name || "V").trim().charAt(0).toUpperCase() || "V";
  }

  async function signedImageUrl(bucket, path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (error) {
      console.warn("Could not create image URL:", error.message);
      return null;
    }
    return data?.signedUrl || null;
  }

  function makeButton(text, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    if (className) button.className = className;
    return button;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  async function initializeHomePage() {
    if (!feedContainer) return;
    if (typeof supabaseClient === "undefined") {
      setFeedMessage("Supabase connection is not available. Check supabase.js.");
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        window.location.replace("login.html");
        return;
      }
      currentUser = data.session.user;
      await loadCurrentUserAvatar();
      await loadFeed();
    } catch (error) {
      console.error("VOLGAN initialization error:", error);
      setFeedMessage(`Unable to load VOLGAN: ${error.message}`);
    }
  }

  async function loadCurrentUserAvatar() {
    if (!userAvatar || !currentUser) return;
    const meta = currentUser.user_metadata || {};
    const name = meta.full_name || meta.name || meta.username || "You";
    userAvatar.textContent = initials(name);
    userAvatar.title = "Open profile";
    userAvatar.style.cursor = "pointer";
    userAvatar.addEventListener("click", () => openProfile(currentUser.id));

    if (meta.avatar_path) {
      const url = await signedImageUrl(PROFILE_BUCKET, meta.avatar_path);
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";
        userAvatar.replaceChildren(img);
      }
    }
  }

  async function loadFeed() {
    if (!currentUser || loadingFeed) return;
    loadingFeed = true;
    setFeedMessage("Loading Moments...");

    try {
      const { data: posts, error } = await supabaseClient
        .from("posts")
        .select("id, user_id, content, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const postList = posts || [];
      if (!postList.length) {
        renderEmptyFeed();
        return;
      }

      const userIds = [...new Set(postList.map(post => post.user_id).filter(Boolean))];
      const postIds = postList.map(post => post.id);
      await loadProfiles(userIds);
      await loadMateStatuses(userIds);

      const [likesResult, commentsResult, repostsResult] = await Promise.all([
        supabaseClient.from("post_likes").select("post_id, user_id").in("post_id", postIds),
        supabaseClient.from("comments").select("post_id").in("post_id", postIds),
        supabaseClient.from("post_reposts").select("post_id, user_id").in("post_id", postIds)
      ]);

      const likes = likesResult.error ? [] : (likesResult.data || []);
      const comments = commentsResult.error ? [] : (commentsResult.data || []);
      const reposts = repostsResult.error ? [] : (repostsResult.data || []);
      if (likesResult.error) console.info("Like counts unavailable:", likesResult.error.message);
      if (commentsResult.error) console.info("Comment counts unavailable:", commentsResult.error.message);
      if (repostsResult.error) console.info("Relay counts unavailable:", repostsResult.error.message);

      const stats = {
        likeCounts: {}, commentCounts: {}, repostCounts: {},
        liked: new Set(), relayed: new Set()
      };
      likes.forEach(row => {
        stats.likeCounts[row.post_id] = (stats.likeCounts[row.post_id] || 0) + 1;
        if (row.user_id === currentUser.id) stats.liked.add(row.post_id);
      });
      comments.forEach(row => {
        stats.commentCounts[row.post_id] = (stats.commentCounts[row.post_id] || 0) + 1;
      });
      reposts.forEach(row => {
        stats.repostCounts[row.post_id] = (stats.repostCounts[row.post_id] || 0) + 1;
        if (row.user_id === currentUser.id) stats.relayed.add(row.post_id);
      });

      const orderedPosts = [...postList].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      if (feedFilter?.value === "all" || feedFilter?.value === "latest") {
        // Both options currently show all available posts, newest first.
      }

      const fragment = document.createDocumentFragment();
      for (const post of orderedPosts) {
        fragment.appendChild(await createPostCard(post, stats));
      }
      feedContainer.replaceChildren(fragment);
    } catch (error) {
      console.error("VOLGAN feed error:", error);
      setFeedMessage(`Unable to load Moments: ${error.message}`);
    } finally {
      loadingFeed = false;
    }
  }

  async function loadProfiles(userIds) {
    if (!userIds.length) return;
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, username, full_name, avatar_path")
      .in("id", userIds);
    if (error) throw error;
    profilesById = new Map((data || []).map(profile => [profile.id, profile]));
  }

  async function loadMateStatuses(userIds) {
    const otherIds = userIds.filter(id => id !== currentUser.id);
    mateRowsByUserId = new Map();
    if (!otherIds.length) return;

    const { data, error } = await supabaseClient
      .from("friend_requests")
      .select("id, sender_id, receiver_id, status")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
    if (error) {
      console.warn("Mate status could not be loaded:", error.message);
      return;
    }

    (data || []).forEach(row => {
      const otherId = row.sender_id === currentUser.id ? row.receiver_id : row.sender_id;
      if (!otherIds.includes(otherId)) return;
      const old = mateRowsByUserId.get(otherId);
      if (!old || row.status === "accepted" || row.status === "pending") {
        mateRowsByUserId.set(otherId, row);
      }
    });
  }

  function renderEmptyFeed() {
    const empty = document.createElement("div");
    empty.className = "empty-feed";
    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "🌊";
    const title = document.createElement("h3");
    title.textContent = "Your VOLGAN journey starts here!";
    const message = document.createElement("p");
    message.textContent = "Moments from your community will appear here.";
    empty.append(icon, title, message);
    feedContainer.replaceChildren(empty);
  }

  async function createPostCard(post, stats) {
    const ownPost = post.user_id === currentUser.id;
    const name = getDisplayName(post.user_id);
    const profile = profilesById.get(post.user_id);
    const card = document.createElement("article");
    card.className = "volgan-post-card";

    const header = document.createElement("div");
    header.className = "volgan-post-header";

    const avatar = document.createElement("div");
    avatar.className = "volgan-post-avatar";
    avatar.textContent = initials(name);
    avatar.title = "View profile";
    avatar.style.cursor = "pointer";
    avatar.addEventListener("click", () => openProfile(post.user_id));
    if (profile?.avatar_path) {
      const avatarUrl = await signedImageUrl(PROFILE_BUCKET, profile.avatar_path);
      if (avatarUrl) {
        const img = document.createElement("img");
        img.src = avatarUrl;
        img.alt = name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "50%";
        avatar.replaceChildren(img);
      }
    }

    const nameButton = makeButton(name, "volgan-post-author");
    nameButton.addEventListener("click", () => openProfile(post.user_id));
    header.append(avatar, nameButton);

    if (ownPost) {
      const menuWrap = document.createElement("div");
      menuWrap.className = "post-menu-wrapper";
      const menuToggle = makeButton("⋯", "post-menu-button");
      const menu = document.createElement("div");
      menu.className = "post-menu";
      menu.hidden = true;
      const edit = makeButton("Edit Moment");
      const remove = makeButton("Delete Moment");
      menuToggle.addEventListener("click", () => { menu.hidden = !menu.hidden; });
      edit.addEventListener("click", () => { menu.hidden = true; editPost(post); });
      remove.addEventListener("click", () => { menu.hidden = true; deletePost(post); });
      menu.append(edit, remove);
      menuWrap.append(menuToggle, menu);
      header.appendChild(menuWrap);
    } else {
      const mateButton = makeButton("+ Mate", "feed-mate-button");
      mateButton.style.marginLeft = "auto";
      paintMateButton(mateButton, mateRowsByUserId.get(post.user_id));
      mateButton.addEventListener("click", () => sendOrAcceptMate(post.user_id, mateButton));
      header.appendChild(mateButton);
    }

    card.appendChild(header);
    const date = document.createElement("small");
    date.className = "volgan-post-date";
    date.textContent = formatDate(post.created_at);
    card.appendChild(date);

    if (post.content) {
      const content = document.createElement("p");
      content.className = "volgan-post-content";
      content.textContent = post.content;
      card.appendChild(content);
    }

    if (post.image_url) {
      const imageUrl = await signedImageUrl(IMAGE_BUCKET, post.image_url);
      if (imageUrl) {
        const image = document.createElement("img");
        image.className = "volgan-post-image";
        image.src = imageUrl;
        image.alt = "Moment image";
        image.loading = "lazy";
        card.appendChild(image);
      }
    }

    const actions = document.createElement("div");
    actions.className = "volgan-action-bar";
    const wander = makeButton(`🌍 Wander ${stats.likeCounts[post.id] || 0}`, "wander-button");
    if (stats.liked.has(post.id)) wander.classList.add("active");
    wander.addEventListener("click", () => toggleWander(post.id, wander));

    const whisper = makeButton(`💬 Whisper ${stats.commentCounts[post.id] || 0}`, "whisper-button");
    whisper.addEventListener("click", () => {
      window.location.href = `comments.html?post_id=${encodeURIComponent(post.id)}`;
    });

    const dispatch = makeButton("✈️ Dispatch", "dispatch-button");
    dispatch.addEventListener("click", () => dispatchMoment(post));

    const relay = makeButton(`🔁 Relay ${stats.repostCounts[post.id] || 0}`, "relay-button");
    if (stats.relayed.has(post.id)) relay.classList.add("active");
    relay.addEventListener("click", () => toggleRelay(post.id, relay));

    actions.append(wander, whisper, dispatch, relay);
    card.appendChild(actions);
    return card;
  }

  function paintMateButton(button, row) {
    button.disabled = false;
    button.textContent = "+ Mate";
    if (!row) return;
    if (row.status === "accepted") {
      button.textContent = "✓ Mate";
      button.disabled = true;
    } else if (row.status === "pending") {
      if (row.receiver_id === currentUser.id) {
        button.textContent = "Accept Mate";
      } else {
        button.textContent = "Request Sent";
        button.disabled = true;
      }
    }
  }

  async function sendOrAcceptMate(otherUserId, button) {
    if (!otherUserId || button.disabled) return;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "Please wait...";
    try {
      const { data: rows, error } = await supabaseClient
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`);
      if (error) throw error;
      const accepted = (rows || []).find(row => row.status === "accepted");
      if (accepted) {
        mateRowsByUserId.set(otherUserId, accepted);
        paintMateButton(button, accepted);
        return;
      }
      const pending = (rows || []).find(row => row.status === "pending");
      if (pending) {
        if (pending.receiver_id !== currentUser.id) {
          mateRowsByUserId.set(otherUserId, pending);
          paintMateButton(button, pending);
          return;
        }
        const { data, error: updateError } = await supabaseClient
          .from("friend_requests").update({ status: "accepted" }).eq("id", pending.id)
          .select("id, sender_id, receiver_id, status");
        if (updateError) throw updateError;
        if (!data?.length) throw new Error("Request was not accepted. Check friend_requests UPDATE policy.");
        mateRowsByUserId.set(otherUserId, data[0]);
        paintMateButton(button, data[0]);
        return;
      }
      const { data, error: insertError } = await supabaseClient
        .from("friend_requests")
        .insert({ sender_id: currentUser.id, receiver_id: otherUserId, status: "pending" })
        .select("id, sender_id, receiver_id, status").single();
      if (insertError) throw insertError;
      mateRowsByUserId.set(otherUserId, data);
      paintMateButton(button, data);
    } catch (error) {
      console.error("Mate request error:", error);
      alert(error.message || "Mate request failed.");
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  async function toggleWander(postId, button) {
    button.disabled = true;
    try {
      const { data: existing, error: selectError } = await supabaseClient
        .from("post_likes").select("post_id")
        .eq("post_id", postId).eq("user_id", currentUser.id).maybeSingle();
      if (selectError) throw selectError;
      if (existing) {
        const { error } = await supabaseClient.from("post_likes")
          .delete().eq("post_id", postId).eq("user_id", currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from("post_likes")
          .insert({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      }
      await loadFeed();
    } catch (error) {
      console.error("Wander error:", error);
      alert(error.message || "Could not update Wander.");
      button.disabled = false;
    }
  }

  async function toggleRelay(postId, button) {
    button.disabled = true;
    try {
      const { data: existing, error: selectError } = await supabaseClient
        .from("post_reposts").select("id")
        .eq("post_id", postId).eq("user_id", currentUser.id).maybeSingle();
      if (selectError) throw selectError;
      if (existing) {
        const { error } = await supabaseClient.from("post_reposts")
          .delete().eq("post_id", postId).eq("user_id", currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseClient.from("post_reposts")
          .insert({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      }
      await loadFeed();
    } catch (error) {
      console.error("Relay error:", error);
      alert(error.message || "Could not update Relay.");
      button.disabled = false;
    }
  }

  async function dispatchMoment(post) {
    const url = new URL("index.html", window.location.href);
    url.searchParams.set("moment", post.id);
    const shareData = {
      title: "VOLGAN Moment",
      text: post.content || "Check out this Moment on VOLGAN!",
      url: url.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.href);
        alert("Moment link copied!");
      } else {
        window.prompt("Copy this Moment link:", url.href);
      }
    } catch (error) {
      if (error.name !== "AbortError") alert(error.message || "Share failed.");
    }
  }

  async function editPost(post) {
    if (post.user_id !== currentUser.id) return;
    const newContent = window.prompt("Edit your Moment:", post.content || "");
    if (newContent === null) return;
    const content = newContent.trim();
    if (!content && !post.image_url) {
      alert("Moment cannot be empty.");
      return;
    }
    try {
      const { data, error } = await supabaseClient.from("posts")
        .update({ content }).eq("id", post.id).eq("user_id", currentUser.id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Post not updated. Check posts UPDATE policy.");
      await loadFeed();
    } catch (error) {
      console.error("Edit Moment error:", error);
      alert(error.message || "Could not edit Moment.");
    }
  }

  async function deletePost(post) {
    if (post.user_id !== currentUser.id) return;
    if (!window.confirm("Delete this Moment permanently?")) return;
    try {
      const { data, error } = await supabaseClient.from("posts")
        .delete().eq("id", post.id).eq("user_id", currentUser.id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Post was not deleted. Check posts DELETE policy.");
      if (post.image_url && !/^https?:\/\//i.test(post.image_url)) {
        const { error: storageError } = await supabaseClient.storage
          .from(IMAGE_BUCKET).remove([post.image_url]);
        if (storageError) console.warn("Image cleanup failed:", storageError.message);
      }
      await loadFeed();
    } catch (error) {
      console.error("Delete Moment error:", error);
      alert(error.message || "Could not delete Moment.");
    }
  }

  // Connect the exact controls present in the supplied HTML.
  createPostButton?.addEventListener("click", goToCreatePost);
  textPostButton?.addEventListener("click", goToCreatePost);
  feedFilter?.addEventListener("change", loadFeed);

  // Start after the HTML and Supabase scripts are ready.
  initializeHomePage();
})();

// VOLGAN NOTIFICATION SYSTEM

const notificationButton = document.getElementById("notificationButton");
const notificationCount = document.getElementById("notificationCount");

async function loadNotificationCount() {
    const { data: { user }, error: authError } =
        await supabase.auth.getUser();

    if (authError || !user) return;

    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

    if (error) {
        console.error("Notification error:", error.message);
        return;
    }

    if (count > 0) {
        notificationCount.textContent = count > 99 ? "99+" : count;
        notificationCount.hidden = false;
    } else {
        notificationCount.hidden = true;
    }
}

// Load notification count
loadNotificationCount();

// Realtime notification updates
const notificationChannel = supabase
    .channel("volgan-notifications")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "notifications"
        },
        () => {
            loadNotificationCount();
        }
    )
    .subscribe();

// VOLGAN NOTIFICATION LIST

const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const closeNotifications = document.getElementById("closeNotifications");

async function loadNotifications() {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
        .from("notifications")
        .select("id, sender_id, type, post_id, message, is_read, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("Notification loading error:", error);
        notificationList.textContent = "Unable to load notifications.";
        return;
    }

    notificationList.innerHTML = "";

    if (!data || data.length === 0) {
        notificationList.textContent = "No notifications yet.";
        return;
    }

    data.forEach(notification => {

        const item = document.createElement("div");
        item.className = "notification-item";

        const message = document.createElement("p");
        message.textContent = notification.message;

        const time = document.createElement("small");
        time.textContent = new Date(
            notification.created_at
        ).toLocaleString();

        item.appendChild(message);
        item.appendChild(time);

        if (!notification.is_read) {
            item.classList.add("unread");

            item.addEventListener("click", async () => {

                const { error } = await supabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("id", notification.id);

                if (!error) {
                    item.classList.remove("unread");
                    loadNotificationCount();
                }
            });
        }

        notificationList.appendChild(item);
    });
}


// OPEN NOTIFICATION PANEL

notificationButton?.addEventListener("click", () => {

    notificationPanel.hidden = !notificationPanel.hidden;

    if (!notificationPanel.hidden) {
        loadNotifications();
    }

});


// CLOSE NOTIFICATION PANEL

closeNotifications?.addEventListener("click", () => {
    notificationPanel.hidden = true;
});


// REALTIME LIST REFRESH

supabaseClient
    .channel("volgan-notification-list")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "notifications"
        },
        () => {
            loadNotificationCount();

            if (!notificationPanel.hidden) {
                loadNotifications();
            }
        }
    )
    .subscribe();


// VOLGAN RECENT NOTIFICATION PREVIEW

const recentNotificationList =
    document.getElementById("recentNotificationList");

const viewAllNotifications =
    document.getElementById("viewAllNotifications");


async function loadRecentNotifications() {

    const { data: { user }, error: authError } =
        await supabase.auth.getUser();

    if (authError || !user) return;

    const { data, error } = await supabase
        .from("notifications")
        .select("id, type, message, is_read, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

    if (error) {
        console.error("Recent notification error:", error);
        return;
    }

    recentNotificationList.innerHTML = "";

    if (!data || data.length === 0) {
        recentNotificationList.textContent =
            "No new notifications";
        return;
    }

    data.forEach(notification => {

        const item = document.createElement("div");
        item.className = "recent-notification-item";

        const icon = document.createElement("span");

        const icons = {
            message: "💬",
            comment: "🗨️",
            share: "🔁"
        };

        icon.textContent = icons[notification.type] || "🔔";

        const content = document.createElement("div");

        const message = document.createElement("p");
        message.textContent = notification.message;

        const time = document.createElement("small");
        time.textContent = new Date(
            notification.created_at
        ).toLocaleString();

        content.appendChild(message);
        content.appendChild(time);

        item.appendChild(icon);
        item.appendChild(content);

        if (!notification.is_read) {
            item.classList.add("unread");
        }

        recentNotificationList.appendChild(item);

    });
}


// VIEW ALL NOTIFICATIONS

viewAllNotifications?.addEventListener("click", () => {

    notificationPanel.hidden = false;

    loadNotifications();

});


// INITIAL LOAD

loadRecentNotifications();


// REALTIME PREVIEW UPDATE

supabaseClient.
    .channel("volgan-recent-preview")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "notifications"
        },
        () => {
            loadRecentNotifications();
        }
    )
    .subscribe();

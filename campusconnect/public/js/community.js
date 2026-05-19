const API = "/posts";
let allPosts = [];
let userRole = null;

async function init() {
  const sessionRes = await fetch("/session-info");
  const sessionData = await sessionRes.json();
  userRole = sessionData.role;

  console.log("Logged in as:", userRole);

  const badge   = document.getElementById("roleBadge");
  const name    = document.getElementById("avatarName");
  const initial = document.getElementById("avatarInitial");

  badge.textContent  = userRole;
  badge.className    = "role-chip " + userRole;

  if (userRole === "admin") {
    name.textContent    = "Admin";
    initial.textContent = "A";
    document.querySelectorAll(".hide-for-admin").forEach(el => el.style.display = "none");
  }

  if (userRole === "student") {
    document.getElementById("createPanel").style.display = "block";
  }

  await loadPosts();
}

async function loadPosts() {
  const res  = await fetch(API);
  allPosts   = await res.json();
  applyFilters();
}

function applyFilters() {
  const search   = document.getElementById("searchInput").value.toLowerCase().trim();
  const category = document.getElementById("filterCategory").value;

  let filtered = [...allPosts];
  if (category !== "All") filtered = filtered.filter(p => p.category === category);
  if (search)             filtered = filtered.filter(p => p.title.toLowerCase().includes(search));

  renderPosts(filtered, search, category);
}

function clearFilters() {
  document.getElementById("searchInput").value   = "";
  document.getElementById("filterCategory").value = "All";
  applyFilters();
}

function getCategoryClass(cat) {
  return { Task: "tag-task", Service: "tag-service", Selling: "tag-selling" }[cat] || "tag-task";
}

function renderPosts(posts, search, category) {
  const list  = document.getElementById("postList");
  const count = document.getElementById("resultsCount");

  count.textContent = posts.length + " post" + (posts.length !== 1 ? "s" : "") +
    ((search || category !== "All") ? " matching your filters" : "");

  list.innerHTML = "";

  if (posts.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No posts found.</p></div>`;
    return;
  }

  posts.forEach(function(post) {
    // Safely get the string ID
    var postId = String(post._id);

    var item = document.createElement("div");
    item.className = "post-item";

    var titleText = post.title;
    if (search) {
      var escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      titleText = post.title.replace(
        new RegExp("(" + escaped + ")", "gi"),
        '<mark style="background:var(--maroon-light);color:var(--maroon);border-radius:3px;padding:0 2px;">$1</mark>'
      );
    }

    var info = document.createElement("div");
    info.className = "post-info";
    info.innerHTML = '<div class="post-title">' + titleText + '</div>' +
                     '<div class="post-meta">#' + postId.slice(-6) + '</div>';

    var tag = document.createElement("span");
    tag.className  = "category-tag " + getCategoryClass(post.category);
    tag.textContent = post.category;

    item.appendChild(info);
    item.appendChild(tag);

    // Show delete for BOTH student and admin
    if (userRole === "student" || userRole === "admin") {
      var btn = document.createElement("button");
      btn.className  = "btn btn-danger";
      btn.textContent = "Delete";

      // Use a closure to capture the correct postId
      (function(id) {
        btn.addEventListener("click", function() {
          console.log("Deleting post:", id);
          deletePost(id);
        });
      })(postId);

      item.appendChild(btn);
    }

    list.appendChild(item);
  });
}

async function addPost() {
  var titleInput = document.getElementById("newTitle");
  var title      = titleInput.value.trim();
  var category   = document.getElementById("newCategory").value;
  if (!title) { titleInput.focus(); return; }

  var res = await fetch(API, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ title: title, category: category })
  });

  if (res.ok) {
    titleInput.value = "";
    await loadPosts();
  }
}

async function deletePost(id) {
  console.log("DELETE request to:", API + "/" + id);

  var res = await fetch(API + "/" + id, { method: "DELETE" });

  console.log("Delete response status:", res.status);

  if (res.ok) {
    await loadPosts();
  } else {
    var text = await res.text();
    console.error("Delete failed:", res.status, text);
    alert("Delete failed: " + res.status + " " + text);
  }
}

init();
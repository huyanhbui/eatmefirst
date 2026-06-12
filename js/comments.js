// Real-time comments backed by the Firebase Realtime Database.
// Loaded as a module from single-post.html.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  ref,
  push,
  onValue,
  query,
  orderByChild,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// One comment thread per blog post. Change this string per page if you add more posts.
const POST_ID = "mid-autumn-festival";

const listEl = document.getElementById("comment-list");
const formEl = document.getElementById("comment-form");
const textEl = document.getElementById("comment-text");
const submitEl = document.getElementById("comment-submit");
const statusEl = document.getElementById("comment-auth-status");

let currentUser = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ----- Auth state controls whether the form is usable -----
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    const who = user.displayName || user.email;
    statusEl.innerHTML = `Commenting as <strong>${escapeHtml(who)}</strong>.`;
    textEl.disabled = false;
    submitEl.disabled = false;
    textEl.placeholder = "Share your thoughts...";
  } else {
    statusEl.innerHTML =
      `Please <a href="/log in.html">log in</a> or <a href="/signup.html">sign up</a> to leave a comment.`;
    textEl.disabled = true;
    submitEl.disabled = true;
    textEl.placeholder = "Log in to comment";
  }
});

// ----- Live read: re-renders automatically whenever a comment is added -----
const commentsRef = query(ref(db, "comments/" + POST_ID), orderByChild("ts"));
onValue(commentsRef, (snapshot) => {
  const rows = [];
  snapshot.forEach((child) => rows.push(child.val()));
  rows.reverse(); // newest first

  if (!rows.length) {
    listEl.innerHTML = `<p class="no-comments">No comments yet. Be the first to share!</p>`;
    return;
  }

  listEl.innerHTML = rows
    .map(
      (c) => `
      <div class="media comment-item">
        <div class="media-body">
          <h4 class="media-heading">${escapeHtml(c.name || "Anonymous")}</h4>
          <h5>${formatTime(c.ts)}</h5>
          <p>${escapeHtml(c.text)}</p>
        </div>
      </div>`
    )
    .join("");
});

// ----- Write: post a new comment -----
async function postComment(e) {
  e.preventDefault();
  if (!currentUser) {
    alert("Please log in to comment.");
    return;
  }
  const text = textEl.value.trim();
  if (!text) return;

  submitEl.disabled = true;
  const original = submitEl.value;
  submitEl.value = "Posting...";

  try {
    await push(ref(db, "comments/" + POST_ID), {
      uid: currentUser.uid,
      name: currentUser.displayName || currentUser.email,
      text,
      ts: serverTimestamp(),
    });
    textEl.value = "";
  } catch (err) {
    alert("Could not post your comment: " + (err && err.message ? err.message : err));
  } finally {
    submitEl.disabled = false;
    submitEl.value = original;
  }
}

if (formEl) formEl.addEventListener("submit", postComment);

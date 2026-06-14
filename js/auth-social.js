// Shared Google + GitHub sign-in for the login and signup pages.
// Loaded as a module from "log in.html" and "signup.html".
import { auth, db, friendlyAuthError } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// Save a profile record the first time a social user signs in.
async function upsertUser(user) {
  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await set(userRef, {
      name: user.displayName || "",
      email: user.email || "",
      createdAt: Date.now(),
    });
  }
}

async function socialLogin(provider) {
  try {
    const cred = await signInWithPopup(auth, provider);
    await upsertUser(cred.user);
    window.location.replace("index.html");
  } catch (error) {
    alert(friendlyAuthError(error.code));
  }
}

const googleBtn = document.getElementById("google-login");
const githubBtn = document.getElementById("github-login");

if (googleBtn) {
  googleBtn.addEventListener("click", () => socialLogin(new GoogleAuthProvider()));
}
if (githubBtn) {
  githubBtn.addEventListener("click", () => socialLogin(new GithubAuthProvider()));
}

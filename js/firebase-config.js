// Shared Firebase setup for the whole site.
// Import { auth, db } from this file anywhere you need auth or the realtime database.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD1UCq3bxyBfs2j4yebDS9hS8kb_CPV5zk",
  authDomain: "asia-festival.firebaseapp.com",
  databaseURL: "https://asia-festival-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "asia-festival",
  storageBucket: "asia-festival.appspot.com",
  messagingSenderId: "70760559280",
  appId: "1:70760559280:web:14b542768f89ec66f84175",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Turn Firebase's raw error codes into messages a human can read.
export function friendlyAuthError(code) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/missing-password": "Please enter a password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "No account found for that email.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network problem. Check your connection and retry.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/account-exists-with-different-credential":
      "You already have an account with this email using a different sign-in method.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

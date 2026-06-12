// Sign-up handler. Loaded as a module from signup.html.
import { auth, db, friendlyAuthError } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const form = document.getElementById("signup-form");
const submit = document.getElementById("submitt");

function notify(msg) {
  alert(msg);
}

async function register(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("emaill").value.trim();
  const password = document.getElementById("passwordd").value;
  const rePassword = document.getElementById("re_password").value;

  if (!name) return notify("Please enter your name.");
  if (!email) return notify("Please enter your email.");
  if (password.length < 6) return notify("Password should be at least 6 characters.");
  if (password !== rePassword) return notify("The two passwords don't match.");

  submit.disabled = true;
  submit.value = "Creating account...";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Store the display name on the auth profile...
    await updateProfile(cred.user, { displayName: name });
    // ...and keep a profile record in the realtime database.
    await set(ref(db, "users/" + cred.user.uid), {
      name,
      email,
      createdAt: Date.now(),
    });
    notify("Welcome, " + name + "! Your account is ready.");
    window.location.replace("log in.html");
  } catch (error) {
    notify(friendlyAuthError(error.code));
  } finally {
    submit.disabled = false;
    submit.value = "Sign up";
  }
}

// Handle both the button click and Enter-key form submit.
submit.addEventListener("click", register);
if (form) form.addEventListener("submit", register);

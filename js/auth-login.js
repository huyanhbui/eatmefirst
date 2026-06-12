// Login handler. Loaded as a module from "log in.html".
import { auth, friendlyAuthError } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

const form = document.getElementById("signup-form");
const submit = document.getElementById("submitt");

function notify(msg) {
  alert(msg);
}

async function login(e) {
  e.preventDefault();

  const email = document.getElementById("emaill").value.trim();
  const password = document.getElementById("passwordd").value;

  if (!email) return notify("Please enter your email.");
  if (!password) return notify("Please enter your password.");

  submit.disabled = true;
  submit.value = "Signing in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.replace("index.html");
  } catch (error) {
    notify(friendlyAuthError(error.code));
  } finally {
    submit.disabled = false;
    submit.value = "Sign in";
  }
}

submit.addEventListener("click", login);
if (form) form.addEventListener("submit", login);

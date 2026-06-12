import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();
document.getElementById("submitt").addEventListener("click", gotoRes);
const emaill = document.getElementById("email");
function gotoRes()
{
    
    const pass = document.getElementById("password")
    createUserWithEmailAndPassword(auth, emaill, pass)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    alert("1");
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert("2");

    // ..
  });   
}

export default a;
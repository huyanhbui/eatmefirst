// Show/hide password for the auth pages. Plain JS, no jQuery.
// Each eye icon carries a `toggle` attribute holding the CSS selector of its field.
document.querySelectorAll(".toggle-password").forEach(function (icon) {
  icon.addEventListener("click", function () {
    var input = document.querySelector(icon.getAttribute("toggle"));
    if (!input) return;
    var hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    icon.classList.toggle("zmdi-eye", !hidden);
    icon.classList.toggle("zmdi-eye-off", hidden);
  });
});

import { apiRequest } from "./api.js";

const registerForm = document.querySelector("#registerForm");
const loginForm = document.querySelector("#loginForm");
const message = document.querySelector("#message");

function showMessage(text, type = "") {
  if (!message) return;

  message.textContent = text;
  message.className = type;
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = registerForm.username.value.trim();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value;

    showMessage("Creating account...");

    try {
      const result = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      showMessage(
        `${result.message} Redirecting to login...`,
        "success"
      );

      registerForm.reset();

      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1000);
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    showMessage("Logging in...");

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      window.location.href = "/dashboard.html";
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}
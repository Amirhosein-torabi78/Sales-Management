/** @format */

import fetchHandler from "../../../components/modules/fetchHandler.js";

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* ==================== Helpers ==================== */
  const $ = (selector) => document.querySelector(selector);

  /* ==================== Elements ==================== */
  const form = $(".login-form");
  const usernameInput = $("#username");
  const passwordInput = $("#password");
  const loginBtn = $(".login-btn");
  const rememberMeCheckbox = $("#rememberMe");

  /* ==================== Message Box ==================== */
  const messageBox = document.createElement("div");
  messageBox.className = "error-message";
  form.prepend(messageBox);

  const showMessage = (text, isError = true) => {
    messageBox.className = `${
      isError ? "error-message" : "success-message"
    } show`;
    messageBox.textContent = text;
    setTimeout(() => messageBox.classList.remove("show"), 2500);
  };

  /* ==================== Validation ==================== */
  const usernameRegex = /^[A-Za-z0-9_\u0600-\u06FF]{3,16}$/;
  const passwordRegex = /^[\u0600-\u06FFA-Za-z0-9]{4,}$/;

  const validateForm = () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) return showMessage("نام کاربری را وارد کنید"), false;
    if (!usernameRegex.test(username))
      return showMessage("نام کاربری نامعتبر است"), false;

    if (!password) return showMessage("رمز عبور را وارد کنید"), false;
    if (!passwordRegex.test(password))
      return showMessage("رمز عبور باید حداقل ۴ کاراکتر باشد"), false;

    return true;
  };

  /* ==================== Input UI Validation ==================== */
  const attachValidationStyle = (input, regex) => {
    input.addEventListener("blur", () => {
      if (!input.value) return;
      input.style.borderColor = regex.test(input.value) ? "#ccc" : "#dc3545";
    });

    input.addEventListener("focus", () => {
      input.style.borderColor = "#42706f";
    });
  };

  attachValidationStyle(usernameInput, usernameRegex);
  attachValidationStyle(passwordInput, passwordRegex);

  /* ==================== Remember Username ==================== */
  const savedUsername = localStorage.getItem("savedUsername");
  if (savedUsername) {
    usernameInput.value = savedUsername;
    rememberMeCheckbox.checked = true;
  }

  /* ==================== Submit ==================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    loginBtn.disabled = true;
    loginBtn.textContent = "در حال ورود...";

    try {
      const response = await fetchHandler(
        "/login",
        "post",
        JSON.stringify({
          userName: usernameInput.value.trim(),
          password: passwordInput.value.trim(),
        }),
        { "Content-Type": "application/json" }
      );

      if (!response?.success) {
        throw new Error(response?.error || "خطا در ورود");
      }

      if (rememberMeCheckbox.checked) {
        localStorage.setItem("savedUsername", usernameInput.value.trim());
      } else {
        localStorage.removeItem("savedUsername");
      }

      showMessage(response.message, false);

      setTimeout(() => {
        window.location.href = "../Home/index.html";
      }, 1500);
    } catch (error) {
      showMessage(error.response.data.error || "خطای غیرمنتظره");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "ورود";
    }
  });

  /* ==================== Toggle Password ==================== */
  const togglePasswordBtn = $("#togglePassword");
  if (togglePasswordBtn) {
    const icon = togglePasswordBtn.querySelector("i");

    togglePasswordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
      icon.className =
        passwordInput.type === "password"
          ? "fa-solid fa-eye-slash"
          : "fa-solid fa-eye";
    });
  }
});

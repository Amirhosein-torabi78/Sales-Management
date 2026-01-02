/** @format */

import fetchHandler from "../../../components/modules/fetchHandler.js";

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* ==================== Helpers ==================== */
  const $ = (selector) => document.querySelector(selector);

  /* ==================== Elements ==================== */
  const form = $("#forgotPasswordForm");
  const emailInput = $("#email");
  const passwordInput = $("#password");
  const submitBtn = $(".submit-btn");

  /* ==================== Message Box ==================== */
  const messageBox = document.createElement("div");
  messageBox.className = "error-message";
  form.prepend(messageBox);

  const showMessage = (text, isError = true) => {
    messageBox.className = `${
      isError ? "error-message" : "success-message"
    } show`;
    messageBox.textContent = text;
    setTimeout(() => messageBox.classList.remove("show"), 2000);
  };

  /* ==================== Validation ==================== */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^.{4,}$/; // همون قبلی، فقط حداقل ۴ کاراکتر

  const validateForm = () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) return showMessage("ایمیل را وارد کنید"), false;
    if (!emailRegex.test(email)) return showMessage("ایمیل نامعتبر است"), false;

    if (!password) return showMessage("رمز عبور را وارد کنید"), false;
    if (!passwordRegex.test(password))
      return showMessage("حداقل ۴ کاراکتر وارد کنید"), false;

    return true;
  };

  /* ==================== Input UI Validation ==================== */
  const attachValidationStyle = (input, regex) => {
    input.addEventListener("blur", () => {
      if (!input.value) return;
      input.style.borderColor = regex.test(input.value) ? "#ccc" : "#dc3545";
    });

    input.addEventListener("focus", () => {
      input.style.borderColor = "#667eea";
    });
  };

  attachValidationStyle(emailInput, emailRegex);
  attachValidationStyle(passwordInput, passwordRegex);

  /* ==================== Submit ==================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "در حال پردازش...";

    try {
      const response = await fetchHandler(
        "/forgotPassword",
        "post",
        JSON.stringify({
          email: emailInput.value.trim(),
          newPassword: passwordInput.value.trim(),
        }),
        { "Content-Type": "application/json" }
      );

      if (!response?.success) {
        throw new Error(response?.error || "خطا در تغییر رمز عبور");
      }

      showMessage(response.message, false);

      setTimeout(() => {
        window.location.href = "../Login/login.html";
      }, 2000);
    } catch (error) {
      showMessage(error.message || "خطای غیرمنتظره");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "تغییر رمز عبور";
    }
  });

  /* ==================== Toggle Password ==================== */
  const togglePasswordBtn = $(".show__Password");
  if (togglePasswordBtn) {
    const icon = togglePasswordBtn.querySelector("i");

    togglePasswordBtn.addEventListener("click", () => {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";

      icon.className =
        passwordInput.type === "password"
          ? "fa-solid fa-eye-slash"
          : "fa-solid fa-eye";
    });
  }
});

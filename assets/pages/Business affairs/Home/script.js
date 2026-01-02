/** @format */
import fetchHandler from "../../../components/modules/fetchHandler.js";
import handleGridNavigation from "../../../components/modules/handleGridNavigation.js";
import redirectToLogin from "../../../components/modules/redirectToLogin.js";

/* =======================
   DOM Utilities
======================= */
const $ = (selector) => document.querySelector(selector);

/* =======================
   Elements
======================= */
const profileBtn = $(".profile");
const userDataBox = $(".user__data");
const exitBtn = $(".Exit");

const userNameEl = $(".userName");
const userEmailEl = $(".userEmail");

/* =======================
   Navigation
======================= */
/* =======================
   UI Handlers
======================= */
function toggleUserBox() {
  userDataBox.classList.toggle("active");
}

/* =======================
   User Data
======================= */
async function loadUserData() {
  try {
    const response = await fetchHandler("/me", "get");

    if (!response?.success || !response?.user) {
      redirectToLogin();
      return;
    }

    const { userName, email } = response.user;
    userNameEl.textContent = userName;
    userEmailEl.textContent = email;
  } catch {
    redirectToLogin();
  }
}

/* =======================
   Auth
======================= */
async function logoutAccount() {
  try {
    const response = await fetchHandler("/logout", "get");

    if (!response?.success) return;

    redirectToLogin();
  } catch (error) {
    redirectToLogin();
  }
}

/* =======================
   Events
======================= */
profileBtn?.addEventListener("click", toggleUserBox);
exitBtn?.addEventListener("click", logoutAccount);
window.addEventListener("load", loadUserData);

/* =======================
   Init
======================= */
handleGridNavigation(".grid-container", ".grid-item");
handleGridNavigation(".report-list", ".report-item", "../../Reports");

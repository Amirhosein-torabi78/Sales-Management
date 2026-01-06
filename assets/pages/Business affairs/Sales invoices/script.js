/** @format */

import createBackButton from "../../../components/modules/createBackButton.js";
import fetchHandler from "../../../components/modules/fetchHandler.js";
import redirectToLogin from "../../../components/modules/redirectToLogin.js";
import appendHtml from "../../../components/modules/appendHtml.js";
import InfiniteScrollObserver from "../../../components/modules/InfiniteScrollObserver.js";
import updateEntity from "../../../components/modules/updateEntity.js";
import deleteEntity from "../../../components/modules/deleteEntity.js";
import convertToPersianWords from "../../../components/modules/convertToPersianWords.js";

/* ========================
   DOM Helpers
======================== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

//=========================
//DOM
//=========================
const DOM = {};
// ========================
// Initialization
// ========================
document.addEventListener("DOMContentLoaded", () => {
  createBackButton(".back-btn");
});
/* ========================
   Fetch / Infinite Scroll
======================== */
let pageNumber = 1;
let isFetching = false;
let allCustomersCount = 0;
let activeFetchFn = null;

// const customerScrollObserver = InfiniteScrollObserver({
//   container: DOM.customerContainer,
//   itemSelector: ".customer",
//   callback: () => {
//     if (!activeFetchFn) return;
//     pageNumber++;
//     activeFetchFn();
//   },
// });

// async function fetchCustomerData(url, key, renderItem) {
//   if (isFetching) return;
//   isFetching = true;

//   try {
//     const response = await fetchHandler(`${url}${pageNumber}`, "GET");

//     if (!response?.success) {
//       DOM.customerContainer.innerHTML = "<p>پاسخی از سرور دریافت نشد</p>";
//       DOM.customerCount.textContent = "طرف حساب ها (0)";
//       redirectToLogin();
//       return;
//     }

//     const items = response[key] || [];

//     if (!items.length) {
//       if (pageNumber === 1) {
//         DOM.customerContainer.innerHTML = "<p>موردی وجود ندارد</p>";
//         DOM.customerCount.textContent = "طرف حساب ها (0)";
//       }
//       return;
//     }

//     if (pageNumber === 1) DOM.customerContainer.innerHTML = "";

//     items.forEach(renderItem);

//     allCustomersCount += items.length;
//     DOM.customerCount.textContent = `طرف حساب ها (${allCustomersCount})`;

//     customerScrollObserver.observe();
//   } catch (err) {
//     console.error(err);
//     DOM.customerContainer.innerHTML = "<p>خطا در دریافت اطلاعات</p>";
//     redirectToLogin();
//   } finally {
//     isFetching = false;
//   }
// }

// async function test() {
//   try {
//     const response = await fetchHandler(`/receiveds`, "get");
//     console.log(response);
    
//   } catch (error) {
//     console.log(error);
//     console.log(error.response?.status);
//     console.log(error.response?.data);
//   }
// }
// test();

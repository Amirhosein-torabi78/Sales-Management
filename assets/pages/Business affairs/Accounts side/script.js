/** @format */
import fetchHandler from "../../../components/modules/fetchHandler.js";
import appendHtml from "../../../components/modules/appendHtml.js";
import handleGridNavigation from "../../../components/modules/handleGridNavigation.js";
import InfiniteScrollObserver from "../../../components/modules/InfiniteScrollObserver.js";
import createBackButton from "../../../components/modules/createBackButton.js";
import redirectToLogin from "../../../components/modules/redirectToLogin.js";
import deleteEntity from "../../../components/modules/deleteEntity.js";
import updateEntity from "../../../components/modules/updateEntity.js";

/* ========================
   DOM Helpers
======================== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ========================
   DOM Elements
======================== */
const DOM = {
  tabs: $$(".tab"),
  customerContainer: $(".empty-state"),
  customerCount: $(".title"),

  fabBtn: $(".fab"),
  newCustomerForm: $(".container__form__add"),
  formUpdate: $(".container__form__update"),
  exitBtn: $(".exit"),
  exitFormUpdate: $(".exit__form__update"),
  showFormUpdate: $(".show__form__update"),

  customrs: $(".customrs"),
  Agencies: $(".Agencies"),
  Visitors: $(".Visitors"),

  addCustomerBtn: $(".add__customer"),
  btnUformUpdate: $(".btn__form__update"),
  btnRemoveCustomer: $(".remove__Entity"),

  exitprofile: $(".exit__profile"),
  containerprofile: $(".container__profile"),

  fullName: $(".fullName"),
  mobileNumber: $(".mobileNumber"),
  workNumber: $(".workNumber"),
  address: $(".address"),

  fullNameUpdate: $(".fullName__update"),
  mobileNumberUpdate: $(".mobileNumber__update"),
  workNumberUpdate: $(".workNumber__update"),
  addressUpdate: $(".address__update"),

  messageAddBox: $(".message__add"),
  messageUpdate: $(".message__update"),

  fullNameCustomer: $("#fullName"),
  firstPhoneCustomer: $("#firstPhone"),
  secoundPhoneCustomer: $("#secoundPhone"),
  addressCustomer: $("#address"),
  purchaseInvoicePrice: $(".purchase__invoice__price"),
  totalPays: $(".totalPays"),
  totalDemands: $(".totalDemands"),
};

/* ========================
   Init
======================== */
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  createBackButton(".back-btn");

  showcustomer();

  DOM.customrs.addEventListener("click", showcustomer);
  DOM.Agencies.addEventListener("click", showAgencies);
  DOM.Visitors.addEventListener("click", showVisitors);

  toggleClass(DOM.fabBtn, DOM.newCustomerForm, "add", "active");
  toggleClass(DOM.exitBtn, DOM.newCustomerForm, "remove", "active");
  toggleClass(DOM.showFormUpdate, DOM.formUpdate, "add", "active");
  toggleClass(DOM.exitFormUpdate, DOM.formUpdate, "remove", "active");
  toggleClass(DOM.exitprofile, DOM.containerprofile, "remove", "active");

  handleGridNavigation(".Invoices", ".item", "../");

  DOM.addCustomerBtn.addEventListener("click", handleNewCustomer);
  DOM.customerContainer.addEventListener("click", getCustomerInfo);

  DOM.btnRemoveCustomer.addEventListener("click", () =>
    handleDelete(`/customers/${DOM.btnRemoveCustomer.id}`)
  );

  DOM.btnUformUpdate.addEventListener("click", () =>
    editEntity(
      `/customers/${DOM.btnRemoveCustomer.id}`,
      DOM.fullNameUpdate.value,
      DOM.mobileNumberUpdate.value,
      DOM.workNumberUpdate.value,
      DOM.addressUpdate.value
    )
  );
});

/* ========================
   Tabs
======================== */
function initTabs() {
  DOM.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      DOM.tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
    });
  });
}

/* ========================
   Utils
======================== */
function toggleClass(btn, target, action, cls) {
  if (!btn || !target) return;
  btn.addEventListener("click", () => {
    if (action === "add") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    target.classList[action](cls);
  });
}

/* ========================
   Fetch / Infinite Scroll
======================== */
let pageNumber = 1;
let isFetching = false;
let allCustomersCount = 0;
let activeFetchFn = null;

const customerScrollObserver = InfiniteScrollObserver({
  container: DOM.customerContainer,
  itemSelector: ".customer",
  callback: () => {
    if (!activeFetchFn) return;
    pageNumber++;
    activeFetchFn();
  },
});

async function fetchCustomerData(url, key, renderItem) {
  if (isFetching) return;
  isFetching = true;

  try {
    const response = await fetchHandler(`${url}${pageNumber}`, "GET");

    if (!response?.success) {
      DOM.customerContainer.innerHTML = "<p>پاسخی از سرور دریافت نشد</p>";
      DOM.customerCount.textContent = "طرف حساب ها (0)";
      redirectToLogin();
      return;
    }

    const items = response[key] || [];

    if (!items.length) {
      if (pageNumber === 1) {
        DOM.customerContainer.innerHTML = "<p>موردی وجود ندارد</p>";
        DOM.customerCount.textContent = "طرف حساب ها (0)";
      }
      return;
    }

    if (pageNumber === 1) DOM.customerContainer.innerHTML = "";

    items.forEach(renderItem);

    allCustomersCount += items.length;
    DOM.customerCount.textContent = `طرف حساب ها (${allCustomersCount})`;

    customerScrollObserver.observe();
  } catch (err) {
    console.error(err);
    DOM.customerContainer.innerHTML = "<p>خطا در دریافت اطلاعات</p>";
    redirectToLogin();
  } finally {
    isFetching = false;
  }
}

/* ========================
   Add New Customer
======================== */
const mobileRegex = /^09\d{9}$/;

async function handleNewCustomer() {
  resetMessage(DOM.messageAddBox, "message__add");

  if (!DOM.fullName.value.trim()) {
    return showMessage(
      DOM.messageAddBox,
      "نام و نام خانوادگی اجباری هست",
      "error",
      { baseClass: "message__add" }
    );
  }

  if (DOM.mobileNumber.value && !mobileRegex.test(DOM.mobileNumber.value)) {
    return showMessage(
      DOM.messageAddBox,
      "شماره همراه مشتری اشتباه هست",
      "error",
      { baseClass: "message__add" }
    );
  }

  try {
    const response = await fetchHandler(
      "/customers",
      "post",
      JSON.stringify({
        fullName: DOM.fullName.value,
        firstPhone: DOM.mobileNumber.value,
        secoundPhone: DOM.workNumber.value,
        address: DOM.address.value,
      }),
      { "content-type": "application/json" }
    );

    if (!response) return;

    showMessage(DOM.messageAddBox, response.message, "success", {
      baseClass: "message__add",
    });

    DOM.fullName.value =
      DOM.mobileNumber.value =
      DOM.workNumber.value =
      DOM.address.value =
        "";
  } catch (err) {
    console.error(err);
  }
}

/* ========================
   Messages
======================== */
function resetMessage(el, baseClass) {
  if (!el) return;
  el.className = baseClass;
  el.textContent = "";
}

function showMessage(el, msg, type, { baseClass }) {
  el.textContent = msg;
  el.className = `${baseClass} ${
    type === "error" ? "error-message" : "success-message"
  }`;
  setTimeout(() => {
    resetMessage(el, baseClass);
  }, 1500);
}

/* ========================
   Customer Profile
======================== */
async function getCustomerInfo(e) {
  const item = e.target.closest("[id]");
  if (!item) return;

  try {
    const res = await fetchHandler(`/customers/${item.id}`, "get");

    DOM.fullNameCustomer.textContent = res.fullName;
    DOM.firstPhoneCustomer.textContent = res.firstPhone || "ثبت نشده";
    DOM.secoundPhoneCustomer.textContent = res.secoundPhone || "ثبت نشده";
    DOM.addressCustomer.textContent = res.address || "ثبت نشده";
    DOM.purchaseInvoicePrice.textContent = res.totalPurchases;
    DOM.totalPays.textContent = res.totalPays;
    DOM.totalDemands.textContent = res.totalDemands;

    DOM.fullNameUpdate.value = res.fullName;
    DOM.mobileNumberUpdate.value = res.firstPhone;
    DOM.workNumberUpdate.value = res.secoundPhone;
    DOM.addressUpdate.value = res.address;

    DOM.btnRemoveCustomer.id = res._id;
    DOM.containerprofile.classList.add("active");
  } catch (err) {
    console.log(err);
  }
}

/* ========================
   Delete / Update
======================== */
async function handleDelete(url) {
  const res = await deleteEntity(url);
  if (!res?.success) return;
  location.reload();
}

async function editEntity(url, fn, m, w, a) {
  const res = await updateEntity(url, fn, m, w, a);
  if (!res?.success) {
    showMessage(DOM.messageUpdate, "نام کاربری الزامی است", "error", {
      baseClass: "message__update",
    });
    return;
  }
  showMessage(DOM.messageUpdate, res.message, "success", {
    baseClass: "message__update",
  });
}

/* ========================
   List Renderers
======================== */
function resetList() {
  pageNumber = 1;
  allCustomersCount = 0;
  customerScrollObserver.disconnect?.();
}

function showcustomer() {
  resetList();
  activeFetchFn = () =>
    fetchCustomerData("/customers?page=", "customers", renderCustomer);
  activeFetchFn();
}

function showAgencies() {
  resetList();
  activeFetchFn = () =>
    fetchCustomerData(
      "/representations?page=",
      "representations",
      renderAgency
    );
  activeFetchFn();
}

function showVisitors() {
  resetList();
  activeFetchFn = () =>
    fetchCustomerData("/sellers?page=", "seller", renderVisitor);
  activeFetchFn();
}

function renderCustomer(e) {
  appendHtml(
    DOM.customerContainer,
    `<div class="customer" id="${e._id}">
      <div class="customer__img"><img src="../../../file/img/avatar-user.jpg"></div>
       <span>${e.fullName}</span>
     <span class="customer__price">${e.totalCredits.toLocaleString(
       "fa-IR"
     )} تومان</span>
     </div>`
  );
}

function renderAgency(e) {
  appendHtml(
    DOM.customerContainer,
    `<div class="customer" id="${e._id}">
      <div class="customer__img"><img src="../../../file/img/avatar-user.jpg"></div>
      <span>${e.name}</span>
    </div>`
  );
}

function renderVisitor(e) {
  appendHtml(
    DOM.customerContainer,
    `<div class="customer" id="${e._id}">
     <div class="customer__img"><img src="../../../file/img/avatar-user.jpg"></div>
      <span>${e.fullName}</span>
    </div>`
  );
}

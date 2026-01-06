/** @format */

import fetchHandler from "../../../components/modules/fetchHandler.js";
import appendHtml from "../../../components/modules/appendHtml.js";
import InfiniteScrollObserver from "../../../components/modules/InfiniteScrollObserver.js";
import createBackButton from "../../../components/modules/createBackButton.js";
import redirectToLogin from "../../../components/modules/redirectToLogin.js";
import deleteEntity from "../../../components/modules/deleteEntity.js";
import convertToPersianWords from "../../../components/modules/convertToPersianWords.js";
import showConfirm from "../../../components/modules/showConfirm.js";

/* ============================================================
   ۱. انتخابگرهای DOM (DOM Selection)
============================================================ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const DOM = {
  container: $(".empty-state"),
  receiptsTab: $("#receiptsTab"),
  paymentsTab: $("#paymentsTab"),
  addBtn: $("#addBtn"),
  
  formContainer: $(".container__form__add"),
  form: $(".new__customer"),
  exitBtn: $(".exit"),
  priceInput: $(".new__prise"),
  priceWords: $("#purchasePriceWords"),
  selectCustomer: $(".select__customer__add"),
  selectSeller: $(".select__seller__add"),
  descriptionInput: $(".Description__add"),
  submitBtn: $(".btn__received__add"),
  messageDisplay: $(".message__add"),
  
  editContainer: $(".container__form__edit"),
  editForm: $(".edit__form"),
  editPrice: $(".edit__price"),
  editPriceWords: $("#editPriceWords"),
  editCustomer: $(".edit__select__customer"),
  editSeller: $(".edit__select__seller"),
  editDesc: $(".edit__description"),
  editSubmitBtn: $(".btn__submit__edit"),
  editExitBtn: $(".exit-edit"),
  editMessage: $(".message__edit"),
};

/* ============================================================
   ۲. وضعیت برنامه و مقداردهی اولیه (State & Init)
============================================================ */
let pageNumber = 1;
let isFetching = false;
let activeFetchFn = null;
let currentEditId = null;
const MESSAGE_BASE_CLASS = "message__add";

document.addEventListener("DOMContentLoaded", () => {
  createBackButton(".backBtn");
  showReceiveds();
  setupEventListeners();
});

/* ============================================================
   ۳. مدیریت رویدادها (Event Listeners)
============================================================ */
function setupEventListeners() {
 
  DOM.receiptsTab.addEventListener("click", () => {
    updateTabUI(DOM.receiptsTab);
    showReceiveds();
  });

  DOM.paymentsTab.addEventListener("click", () => {
    updateTabUI(DOM.paymentsTab);
    showPayments();
  });

 
  DOM.addBtn.addEventListener("click", () => {
    DOM.formContainer.classList.add("active");
    loadFormDependencies();
  });

  DOM.exitBtn.addEventListener("click", () => {
    DOM.formContainer.classList.remove("active");
    DOM.form.reset();
    DOM.priceWords.style.display = "none";
    resetMessage(DOM.messageDisplay, MESSAGE_BASE_CLASS);
  });

 
  DOM.editExitBtn.addEventListener("click", () => {
    DOM.editContainer.style.display = "none";
  });

  
  DOM.priceInput.addEventListener("input", (e) => {
    const val = e.target.value;
    DOM.priceWords.textContent =
      val > 0 ? `${convertToPersianWords(val)} تومان` : "";
    DOM.priceWords.style.display = val > 0 ? "block" : "none";
  });

  DOM.editPrice.addEventListener("input", (e) => {
    const val = e.target.value;
    DOM.editPriceWords.textContent =
      val > 0 ? `${convertToPersianWords(val)} تومان` : "";
  });

  
  DOM.submitBtn.addEventListener("click", handleFormSubmit);
  DOM.editSubmitBtn.addEventListener("click", handleEditSubmit);
}

function updateTabUI(activeElement) {
  $$(".tab").forEach((tab) => tab.classList.remove("active"));
  activeElement.classList.add("active");
}

/* ============================================================
   ۴. منطق دریافت داده‌ها (Fetching Logic)
============================================================ */
async function fetchData(url, dataKey, renderCallback) {
  if (isFetching) return;
  isFetching = true;

  try {
    const response = await fetchHandler(`${url}${pageNumber}`, "GET");
    if (!response?.success) {
      if (pageNumber === 1)
        DOM.container.innerHTML = "<p>خطا در دریافت اطلاعات</p>";
      return;
    }

    const items = response[dataKey] || [];
    items.reverse();

    if (items.length === 0 && pageNumber === 1) {
      DOM.container.innerHTML = "<p>هیچ تراکنشی یافت نشد</p>";
      scrollObserver.disconnect?.();
      return;
    }

    if (pageNumber === 1) DOM.container.innerHTML = "";
    items.forEach(renderCallback);

    items.length < 10
      ? scrollObserver.disconnect?.()
      : scrollObserver.observe();
  } catch (err) {
    console.error(err);
    redirectToLogin();
  } finally {
    isFetching = false;
  }
}

/* ============================================================
   ۵. مدیریت لیست‌های انتخابی (Select Box Dependencies)
============================================================ */
async function loadFormDependencies() {
  try {
    const [custRes, sellRes] = await Promise.all([
      fetchHandler("/customers?page=1&limit=100", "get"),
      fetchHandler("/sellers?page=1&limit=100", "get"),
    ]);
    renderOptions(DOM.selectCustomer, custRes, "انتخاب مشتری...");
    renderOptions(DOM.selectSeller, sellRes, "انتخاب فروشنده...");
  } catch (err) {
    console.error(err);
  }
}

async function syncEditDependencies() {
  try {
    const [custRes, sellRes] = await Promise.all([
      fetchHandler("/customers?page=1&limit=100", "get"),
      fetchHandler("/sellers?page=1&limit=100", "get"),
    ]);

    const customers = custRes?.customers || [];
    if (Array.isArray(customers)) {
      DOM.editCustomer.innerHTML = customers
        .map(
          (c) =>
            `<option value="${c._id}">${
              c.fullName || c.name || "نامشخص"
            }</option>`
        )
        .join("");
    }

    const sellers = sellRes?.sellers || sellRes?.seller || [];
    if (Array.isArray(sellers)) {
      DOM.editSeller.innerHTML = sellers
        .map(
          (s) =>
            `<option value="${s._id}">${
              s.fullName || s.name || "نامشخص"
            }</option>`
        )
        .join("");
    }
  } catch (err) {
    console.error("خطا در بارگذاری لیست‌ها:", err);
  }
}

function renderOptions(el, res, placeholder) {
  if (res?.success) {
    const data = res.customers || res.seller || res.sellers || [];
    el.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
    data.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item._id;
      opt.textContent = item.fullName || item.name;
      el.appendChild(opt);
    });
  }
}

/* ============================================================
   ۶. عملیات ثبت و ویرایش (Create & Update)
============================================================ */
async function handleFormSubmit() {
  const payload = {
    price: DOM.priceInput.value,
    customer: DOM.selectCustomer.value,
    seller: DOM.selectSeller.value,
    description: DOM.descriptionInput.value,
  };

  if (!payload.price || !payload.customer || !payload.seller) {
    return showMessage(
      DOM.messageDisplay,
      "لطفاً تمام فیلدها را پر کنید",
      "error",
      { baseClass: MESSAGE_BASE_CLASS }
    );
  }

  DOM.submitBtn.disabled = true;
  const endpoint = DOM.receiptsTab.classList.contains("active")
    ? "/receiveds"
    : "/payments";
  const res = await fetchHandler(endpoint, "post", JSON.stringify(payload), {
    "Content-Type": "application/json",
  });

  if (res?.success) {
    showMessage(DOM.messageDisplay, res.message, "success", {
      baseClass: MESSAGE_BASE_CLASS,
    });
    setTimeout(() => {
      DOM.formContainer.classList.remove("active");
      DOM.form.reset();
      DOM.receiptsTab.classList.contains("active")
        ? showReceiveds()
        : showPayments();
    }, 1200);
  }
  DOM.submitBtn.disabled = false;
}

async function handleEditSubmit() {
  const payload = {
    price: Number(DOM.editPrice.value),
    customer: DOM.editCustomer.value,
    seller: DOM.editSeller.value,
    description: DOM.editDesc.value,
  };

  if (!payload.price || payload.price < 1) {
    return showMessage(DOM.editMessage, "قیمت نامعتبر است", "error", {
      baseClass: "message__edit",
    });
  }

  DOM.editSubmitBtn.disabled = true;
  DOM.editSubmitBtn.textContent = "در حال ثبت...";

  try {
    const res = await fetchHandler(
      `/receiveds/${currentEditId}`,
      "put",
      JSON.stringify(payload),
      { "Content-Type": "application/json" }
    );

    if (res?.success) {
      showMessage(DOM.editMessage, res.message, "success", {
        baseClass: "message__edit",
      });
      setTimeout(() => {
        DOM.editContainer.style.display = "none";
        showReceiveds();
      }, 1200);
    } else {
      const errorMsg =
        res.response?.data?.error || res?.message || "خطای اعتبارسنجی (422)";
      showMessage(DOM.editMessage, errorMsg, "error", {
        baseClass: "message__edit",
      });
    }
  } catch (err) {
    const catchError = err.response?.data?.error || "خطای ناشناخته در ویرایش";
    showMessage(DOM.editMessage, catchError, "error", {
      baseClass: "message__edit",
    });
  } finally {
    DOM.editSubmitBtn.disabled = false;
    DOM.editSubmitBtn.textContent = "ثبت تغییرات نهایی";
  }
}

/* ============================================================
   ۷. اکشن‌های کارت (Edit & Delete Actions)
============================================================ */
window.handleEdit = async (id) => {
  currentEditId = id;
  const card = document.getElementById(id);
  DOM.editContainer.style.display = "flex";

  await syncEditDependencies();

  const priceText = card.querySelector(".payment-price").textContent;
  const cleanPrice = priceText
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[^\d]/g, "");

  DOM.editPrice.value = cleanPrice;

  DOM.editCustomer.value = card.getAttribute("data-customer-id");
  DOM.editSeller.value = card.getAttribute("data-seller-id");

  const descText = card.querySelector(".payment-desc").textContent;
  DOM.editDesc.value = descText === "بدون توضیحات" ? "" : descText;

  DOM.editPrice.dispatchEvent(new Event("input"));
};

window.handleDelete = async (id) => {
  
  const isConfirmed = await showConfirm("آیا از حذف این تراکنش مطمئن هستید؟");

  if (!isConfirmed) return;

  try {
    const res = await deleteEntity(`/receiveds/${id}`);
    if (res?.success) {
      const element = document.getElementById(id);
      if (element) {
        element.style.opacity = "0";
        setTimeout(() => element.remove(), 300);
      }
    }
  } catch (err) {
    console.error("Delete Error:", err.response?.data?.error);
  }
};

/* ============================================================
   ۸. ابزارهای رابط کاربری (UI Helpers)
============================================================ */
function showMessage(el, msg, type, { baseClass }) {
  el.textContent = msg;
  el.className = `${baseClass} ${
    type === "error" ? "error-message" : "success-message"
  }`;
  setTimeout(() => resetMessage(el, baseClass), 3000);
}

function resetMessage(el, baseClass) {
  if (!el) return;
  el.className = baseClass;
  el.textContent = "";
}

const scrollObserver = InfiniteScrollObserver({
  container: DOM.container,
  itemSelector: ".payment-card",
  callback: () => {
    if (activeFetchFn) {
      pageNumber++;
      activeFetchFn();
    }
  },
});

function resetListState() {
  pageNumber = 1;
  isFetching = false;
  scrollObserver.disconnect?.();
  DOM.container.innerHTML = "";
}

function showReceiveds() {
  resetListState();
  activeFetchFn = () =>
    fetchData("/receiveds?page=", "receiveds", renderPaymentCard);
  activeFetchFn();
}

function showPayments() {
  resetListState();
  activeFetchFn = () =>
    fetchData("/payments?page=", "payments", renderPaymentCard);
  activeFetchFn();
}

/* ============================================================
   ۹. تمپلیت کارت تراکنش (UI Template)
============================================================ */
function renderPaymentCard(item) {
  const customerName = item.customer?.fullName || "نامشخص";
  const sellerName = item.seller?.fullName || "نامشخص";
  const customerId = item.customer?._id || "";
  const sellerId = item.seller?._id || "";
  const formattedDate = new Date(item.updatedAt).toLocaleDateString("fa-IR");

  const template = `
    <div class="payment-card" id="${
      item._id
    }" data-customer-id="${customerId}" data-seller-id="${sellerId}">
      <div class="payment-actions">
        <button class="icon-btn edit-btn" onclick="handleEdit('${
          item._id
        }')"><i class="fas fa-edit"></i></button>
        <button class="icon-btn delete-btn" onclick="handleDelete('${
          item._id
        }')"><i class="fas fa-trash-alt"></i></button>
      </div>
      <div class="payment-header">
        <span class="payment-price">${item.price.toLocaleString(
          "fa-IR"
        )} تومان</span>
        <span class="payment-date">${formattedDate}</span>
      </div>
      <div class="payment-parties">
        <div class="party"><span class="party-label">مشتری:</span> <span class="party-name">${customerName}</span></div>
        <div class="party"><span class="party-label">فروشنده:</span> <span class="party-name">${sellerName}</span></div>
      </div>
      <p class="payment-desc">${item.description || "بدون توضیحات"}</p>
    </div>`;
  appendHtml(DOM.container, template);
}

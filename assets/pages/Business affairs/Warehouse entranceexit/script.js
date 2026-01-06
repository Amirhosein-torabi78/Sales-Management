/** @format */

/* ======================== Imports ======================== */
import appendHtml from "../../../components/modules/appendHtml.js";
import fetchHandler from "../../../components/modules/fetchHandler.js";
import InfiniteScrollObserver from "../../../components/modules/InfiniteScrollObserver.js";
import createBackButton from "../../../components/modules/createBackButton.js";
import convertToPersianWords from "../../../components/modules/convertToPersianWords.js";
import deleteEntity from "../../../components/modules/deleteEntity.js";
import redirectToLogin from "../../../components/modules/redirectToLogin.js";
import showConfirm from "../../../components/modules/showConfirm.js";

/* ======================== DOM Selectors ======================== */
const $ = (selector) => document.querySelector(selector);

const DOM = {
  addModal: $(".add__modal"),
  fabbtn: $(".fab"),
  btnExit: $(".exit"),
  updateExit: $(".update__exit"),
  containerProduct: $(".empty-state"),
  btnAddProduct: $(".btn__submit"),
  messageAddBox: $(".message__add"),
  productName: $(".product__name"),
  purchasePrice: $(".purchasePrice"),
  salePrice: $(".salePrice"),
  inventory: $(".inventory"),
  purchasePriceWords: $("#purchasePriceWords"),
  salePriceWords: $("#salePriceWords"),
  updateModal: $(".update__modal"),
  updateProductName: $(".update__product__name"),
  updatePurchasePrice: $(".update__purchasePrice"),
  updateSalePrice: $(".update__salePrice"),
  updateInventory: $(".update__inventory"),
  btnSubmitUpdate: $(".update__modal .btn__submit"),
  messageUpdateBox: $(".message__update"),
  updatePurchasePriceWords: $("#update__purchasePriceWords"),
  updateSalePriceWords: $("#update__salePriceWords"),
  searchInput: $(".search-input"),
};

/* ======================== Initialization ======================== */
document.addEventListener("DOMContentLoaded", () => {
  createBackButton(".back-button");

  toggleClass(DOM.btnExit, DOM.addModal, "remove", "active");
  toggleClass(DOM.updateExit, DOM.updateModal, "remove", "active");
  toggleClass(DOM.fabbtn, DOM.addModal, "add", "active");

  fetchCustomerData(`/products?page=`, "products", templetHtml);

  DOM.btnAddProduct.addEventListener("click", handleNewProduct);
  DOM.btnSubmitUpdate.addEventListener("click", submitProductUpdate);

  DOM.containerProduct.addEventListener("click", handleDeleteProduct);
  DOM.containerProduct.addEventListener("click", handleUpdateProduct);

  setupPriceWords();

  DOM.searchInput.addEventListener("input", handleSearchInput);
});

/* ======================== Toggle Class Utility ======================== */
function toggleClass(button, target, action, className) {
  if (!button || !target) return;

  button.addEventListener("click", () => {
    target.classList[action](className);

    if (action === "add") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (action === "remove") {
      resetForm();
    }
  });
}

/* ======================== Fetch / Infinite Scroll ======================== */
let pageNumber = 1;
let isFetching = false;
let hasMore = true;
let searchTimeout;

const customerScrollObserver = InfiniteScrollObserver({
  container: DOM.containerProduct,
  itemSelector: ".product-card",
  callback: () => {
    pageNumber++;
    const searchTerm = DOM.searchInput.value.trim();

    if (searchTerm) {
      fetchSearchData(searchTerm);
    } else {
      fetchCustomerData(`/products?page=`, "products", templetHtml);
    }
  },
});

async function fetchCustomerData(url, key, renderItem) {
  if (isFetching || !hasMore) return;
  isFetching = true;

  try {
    const response = await fetchHandler(`${url}${pageNumber}`, "GET");
    if (!response?.success) {
      if (pageNumber === 1) console.error("خطا در دریافت اطلاعات");
      redirectToLogin();
      return;
    }

    const items = response[key] || [];

    if (!items.length) {
      hasMore = false;
      customerScrollObserver.disconnect();
      if (pageNumber === 1) {
        DOM.containerProduct.innerHTML = "<p>موردی وجود ندارد</p>";
      }
      return;
    }

    if (pageNumber === 1) DOM.containerProduct.innerHTML = "";

    items.reverse().forEach(renderItem);
    customerScrollObserver.observe();
  } catch (err) {
    console.error("خطا:", err);
    hasMore = false;
    customerScrollObserver.disconnect();
    redirectToLogin();
  } finally {
    isFetching = false;
  }
}

function templetHtml(e) {
  const createdAt = new Date(e.createdAt).toLocaleDateString("fa-IR");
  const updatedAt = new Date(e.updatedAt).toLocaleDateString("fa-IR");
  const statusClass = e.inventory < 10 ? "low" : "safe";
  const statusText = e.inventory < 10 ? "موجودی رو به اتمام" : "موجودی کافی";

  appendHtml(
    DOM.containerProduct,
    `
    <div class="product-card" data-id="${e._id}">
        <div class="card-actions">
            <button class="icon-btn edit-btn" title="ویرایش"><i class="fas fa-edit"></i></button>
            <button class="icon-btn delete-btn" title="حذف" ><i class="fas fa-trash-alt"></i></button>
        </div>
        <div class="status-tag ${statusClass}">${statusText}</div>
        <h3 class="product-title">${e.name}</h3>
        <div class="info-group">
            <div class="info-item">
                <span class="label">موجودی:</span>
                <span class="value">${e.inventory.toLocaleString(
                  "fa-IR"
                )} عدد</span>
            </div>
            <div class="info-item">
                <span class="label">خرید:</span>
                <span class="value">${e.purchasePrice.toLocaleString(
                  "fa-IR"
                )} تومان</span>
            </div>
            <div class="info-item">
                <span class="label">فروش:</span>
                <span class="value">${e.salePrice.toLocaleString(
                  "fa-IR"
                )} تومان</span>
            </div>
            <div class="date-section">
                <div class="date-item"><span>تولید:</span> ${createdAt}</div>
                <div class="date-item"><span>بروزرسانی:</span> ${updatedAt}</div>
            </div>
        </div>
    </div>
    `
  );
}

/* ======================== Product Actions (Add/Update/Delete) ======================== */
async function handleNewProduct() {
  resetMessage(DOM.messageAddBox, "message__add");

  const payload = {
    name: DOM.productName.value.trim(),
    purchasePrice: Number(DOM.purchasePrice.value),
    salePrice: Number(DOM.salePrice.value),
    inventory: Number(DOM.inventory.value),
  };

  if (
    !payload.name ||
    !payload.purchasePrice ||
    !payload.salePrice ||
    !payload.inventory
  ) {
    return showMessage(
      DOM.messageAddBox,
      "لطفاً تمامی فیلدها را پر کنید",
      "error",
      { baseClass: "message__add" }
    );
  }

  try {
    const response = await fetchHandler(
      "/products",
      "post",
      JSON.stringify(payload),
      { "Content-Type": "application/json" }
    );

    if (response?.success) {
      showMessage(DOM.messageAddBox, "محصول با موفقیت ثبت شد", "success", {
        baseClass: "message__add",
      });
      resetForm();
      pageNumber = 1;
      hasMore = true;
      fetchCustomerData(`/products?page=`, "products", templetHtml);
    } else {
      showMessage(
        DOM.messageAddBox,
        response?.message || "خطایی رخ داد",
        "error",
        { baseClass: "message__add" }
      );
    }
  } catch (err) {
    showMessage(DOM.messageAddBox, "خطا در برقراری ارتباط با سرور", "error", {
      baseClass: "message__add",
    });
  }
}

async function handleUpdateProduct(event) {
  const btnUpdate = event.target.closest(".edit-btn");
  if (!btnUpdate) return;

  const card = btnUpdate.closest(".product-card");
  if (!card) return;

  currentUpdateId = card.dataset.id;
  const name = card.querySelector(".product-title").textContent;

  const getNumberFromText = (el) => {
    if (!el) return "";
    const englishNumbers = el.textContent.replace(/[۰-۹]/g, (d) =>
      "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
    );
    return englishNumbers.replace(/\D/g, "");
  };

  const infoValues = card.querySelectorAll(".info-item .value");
  const inventory = getNumberFromText(infoValues[0]);
  const purchasePrice = getNumberFromText(infoValues[1]);
  const salePrice = getNumberFromText(infoValues[2]);

  DOM.updateProductName.value = name;
  DOM.updateInventory.value = inventory;
  DOM.updatePurchasePrice.value = purchasePrice;
  DOM.updateSalePrice.value = salePrice;

  if (purchasePrice)
    DOM.updatePurchasePriceWords.textContent =
      convertToPersianWords(Number(purchasePrice)) + " تومان";
  if (salePrice)
    DOM.updateSalePriceWords.textContent =
      convertToPersianWords(Number(salePrice)) + " تومان";

  DOM.updateModal.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

let currentUpdateId = null;
async function submitProductUpdate() {
  resetMessage(DOM.messageUpdateBox, "message__update");

  const payload = {
    name: DOM.updateProductName.value.trim(),
    purchasePrice: Number(DOM.updatePurchasePrice.value),
    salePrice: Number(DOM.updateSalePrice.value),
    inventory: Number(DOM.updateInventory.value),
  };

  if (!payload.name || !payload.purchasePrice || !payload.salePrice) {
    return showMessage(
      DOM.messageUpdateBox,
      "نام و قیمت‌ها الزامی هستند",
      "error",
      { baseClass: "message__update" }
    );
  }

  try {
    const response = await fetchHandler(
      `/products/${currentUpdateId}`,
      "put",
      JSON.stringify(payload),
      { "Content-Type": "application/json" }
    );

    if (response?.success) {
      showMessage(
        DOM.messageUpdateBox,
        "تغییرات با موفقیت اعمال شد",
        "success",
        { baseClass: "message__update" }
      );
      setTimeout(() => {
        DOM.updateModal.classList.remove("active");
        location.reload();
      }, 1000);
    } else {
      showMessage(
        DOM.messageUpdateBox,
        response?.message || "خطا در بروزرسانی",
        "error",
        { baseClass: "message__update" }
      );
    }
  } catch (err) {
    showMessage(DOM.messageUpdateBox, "خطای سرور", "error", {
      baseClass: "message__update",
    });
  }
}

async function handleDeleteProduct(event) {
  const btnDelete = event.target.closest(".delete-btn");
  if (!btnDelete) return;
  const card = btnDelete.closest(".product-card");
  if (!card) return;

  const isConfirmed = await showConfirm("آیا از حذف این محصول مطمئن هستید؟");

  if (isConfirmed) {
    const response = await deleteEntity(`/products/${card.dataset.id}`);
    if (response?.success) location.reload();
  }
}

/* ======================== Utilities ======================== */
function setupPriceWords() {
  const handleConversion = (inputEl, displayEl) => {
    if (!inputEl || !displayEl) return;
    inputEl.addEventListener("input", (e) => {
      const value = Number(e.target.value);
      displayEl.textContent =
        value && value > 0 ? convertToPersianWords(value) + " تومان" : "";
    });
  };

  handleConversion(DOM.purchasePrice, DOM.purchasePriceWords);
  handleConversion(DOM.salePrice, DOM.salePriceWords);
  handleConversion(DOM.updatePurchasePrice, DOM.updatePurchasePriceWords);
  handleConversion(DOM.updateSalePrice, DOM.updateSalePriceWords);
}

function resetForm() {
  const fields = [
    DOM.productName,
    DOM.purchasePrice,
    DOM.salePrice,
    DOM.inventory,
    DOM.updateProductName,
    DOM.updatePurchasePrice,
    DOM.updateSalePrice,
    DOM.updateInventory,
  ];
  const words = [
    DOM.purchasePriceWords,
    DOM.salePriceWords,
    DOM.updatePurchasePriceWords,
    DOM.updateSalePriceWords,
  ];

  fields.forEach((field) => (field.value = ""));
  words.forEach((word) => (word.textContent = ""));
}

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
  setTimeout(() => (el.className = baseClass), 1500);
}

async function fetchSearchData(searchTerm) {
  if (isFetching || !hasMore) return;
  isFetching = true;

  try {
    const response = await fetchHandler(
      `/products/search?page=${pageNumber}`,
      "post",
      JSON.stringify({ name: searchTerm }),
      { "Content-Type": "application/json" }
    );

    if (!response?.success) {
      if (pageNumber === 1)
        DOM.containerProduct.innerHTML = "<p>خطا در جستجو</p>";
      return;
    }

    const items = response.products || [];

    if (pageNumber === 1) DOM.containerProduct.innerHTML = "";

    if (items.length === 0) {
      hasMore = false;
      if (pageNumber === 1)
        DOM.containerProduct.innerHTML = "<p>محصولی یافت نشد</p>";
    } else {
      items.forEach(templetHtml);
      customerScrollObserver.observe();
    }
  } catch (err) {
    console.error("Search Error:", err);
  } finally {
    isFetching = false;
  }
}

/* ======================== Event Handlers ======================== */
function handleSearchInput(e) {
  const searchTerm = e.target.value.trim();
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    resetPaginationState();

    if (searchTerm) {
      fetchSearchData(searchTerm);
    } else {
      fetchCustomerData(`/products?page=`, "products", templetHtml);
    }
  }, 600);
}

function resetPaginationState() {
  pageNumber = 1;
  hasMore = true;
  DOM.containerProduct.innerHTML = "";
  customerScrollObserver.disconnect();
}

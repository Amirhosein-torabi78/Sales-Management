/** @format */
/* ======================== Imports ======================== */
import fetchHandler from "../../../components/modules/fetchHandler.js";
import appendHtml from "../../../components/modules/appendHtml.js";
import showConfirm from "../../../components/modules/showConfirm.js";
import InfiniteScrollObserver from "../../../components/modules/InfiniteScrollObserver.js";
import createBackButton from "../../../components/modules/createBackButton.js";
import redirectToLogin from "../../../components/modules/redirectToLogin.js";

/* ======================== Global Config & Variables ======================== */

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const CONFIG = {
  customers: {
    url: "/customers",
    key: "customers",
    nameField: "fullName",
    label: "مشتری",
    plural: "مشتریان",
  },
  representation: {
    url: "/representations",
    key: "representations",
    nameField: "name",
    label: "نمایندگی",
    plural: "نمایندگی‌ها",
  },
  sellers: {
    url: "/sellers",
    key: "seller",
    nameField: "fullName",
    label: "فروشنده",
    plural: "فروشندگان",
  },
};

let currentType = "customers";
let pageNumber = 1;
let isFetching = false;
let allCount = 0;
let activeFetchFn = null;
let scrollObserver = null;

const DOM = {
  tabs: $$(".tab"),
  container: $(".empty-state"),
  titleCount: $(".title"),
  searchInput: $("#globalSearch"),
  addForm: $(".container__form__add"),
  updateForm: $(".container__form__update"),
  profileBox: $(".container__profile"),
  addBtn: $(".add__customer"),
  updateSubmitBtn: $(".btn__form__update"),
  removeBtn: $(".remove__Entity"),
  addMsg: $(".message__add"),
  updateMsg: $(".message__update"),
  fields: {
    add: {
      name: $(".fullName"),
      p1: $(".mobileNumber"),
      p2: $(".workNumber"),
      addr: $(".address"),
    },
    edit: {
      name: $(".fullName__update"),
      p1: $(".mobileNumber__update"),
      p2: $(".workNumber__update"),
      addr: $(".address__update"),
    },
  },
};

/* ======================== Initialization ======================== */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  createBackButton(".back-btn");

  scrollObserver = InfiniteScrollObserver({
    container: DOM.container,
    itemSelector: ".customer",
    callback: () => {
      if (!isFetching && allCount >= 10 && allCount % 10 === 0) {
        pageNumber++;
        if (activeFetchFn) activeFetchFn();
      }
    },
    threshold: 0.8,
  });

  showData("customers");

  DOM.addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleAdd();
  });
  DOM.updateSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleUpdate();
  });
  DOM.removeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleDelete();
  });

  DOM.container.addEventListener("click", openProfile);
  DOM.searchInput.addEventListener("input", debounce(handleSearch, 800));

  setupToggle($(".fab"), DOM.addForm, "add");
  setupToggle($(".exit"), DOM.addForm, "remove");
  setupToggle($(".show__form__update"), DOM.updateForm, "add");
  setupToggle($(".exit__form__update"), DOM.updateForm, "remove");
  setupToggle($(".exit__profile"), DOM.profileBox, "remove");
});

/* ======================== UI Sync & Messaging ======================== */

function showMessage(element, text, isSuccess = true) {
  if (!element) return;

  element.textContent = text;
  const className = isSuccess ? "success-message" : "error-message";

  element.classList.add(className);

  setTimeout(() => {
    element.textContent = "";
    element.classList.remove(className);
  }, 4000);
}

function updateUI(type) {
  const info = CONFIG[type];
  const label = info.label;

  $(".container__form__add h5").textContent = `اطلاعات ${label} جدید وارد کنید`;
  DOM.addBtn.textContent = `اطلاعات ${label} جدید وارد کنید`;
  DOM.fields.add.name.placeholder = `نام ${label} را وارد کنید`;

  $(".container__form__update h5").textContent = `تغییر اطلاعات ${label}`;
  DOM.updateSubmitBtn.textContent = `ثبت تغییرات ${label}`;
  DOM.fields.edit.name.placeholder = `نام جدید ${label} را وارد کنید`;
}

/* ======================== Data Fetching & Rendering ======================== */

async function showData(type) {
  currentType = type;
  updateUI(type);
  pageNumber = 1;
  allCount = 0;
  DOM.container.innerHTML = "";

  activeFetchFn = async () => {
    if (isFetching) return;
    isFetching = true;
    try {
      const res = await fetchHandler(
        `${CONFIG[type].url}?page=${pageNumber}`,
        "get"
      );
      renderList(res, CONFIG[type].key);
    } catch (err) {
      console.error(err);
    } finally {
      isFetching = false;
    }
  };
  activeFetchFn();
}

function renderList(res, key) {
  if (!res?.success) return redirectToLogin();
  const dataKey = res[key]
    ? key
    : res["sellers"]
    ? "sellers"
    : res["data"]
    ? "data"
    : key;
  const items = res[dataKey] || [];

  if (pageNumber === 1 && items.length === 0) {
    DOM.container.innerHTML = "<p>موردی یافت نشد.</p>";
    DOM.titleCount.textContent = `${CONFIG[currentType].plural} (۰)`;
    return;
  }

  items.forEach((item) => {
    const name = item.fullName || item.name;
    appendHtml(
      DOM.container,
      `
      <div class="customer" id="${item._id}">
        <div class="customer__img"><img src="../../../file/img/avatar-user.jpg"></div>
        <span>${name}</span>
        <span class="customer__price">${(
          item.totalCredits || 0
        ).toLocaleString()} تومان</span>
      </div>
    `
    );
  });

  allCount += items.length;
  DOM.titleCount.textContent = `${CONFIG[currentType].plural} (${allCount})`;

  if (scrollObserver) scrollObserver.observe();
}

/* ======================== Search Logic ======================== */

async function handleSearch() {
  const query = DOM.searchInput.value.trim();
  if (!query) return showData(currentType);
  pageNumber = 1;
  allCount = 0;
  DOM.container.innerHTML = "در حال جستجو...";

  activeFetchFn = async () => {
    if (isFetching) return;
    isFetching = true;
    try {
      const body = { [CONFIG[currentType].nameField]: query };
      const searchUrl =
        currentType === "customers"
          ? "/customers/search"
          : `${CONFIG[currentType].url}/search`;
      const res = await fetchHandler(
        `${searchUrl}?page=${pageNumber}`,
        "post",
        JSON.stringify(body),
        { "content-type": "application/json" }
      );
      if (pageNumber === 1) DOM.container.innerHTML = "";
      renderList(res, CONFIG[currentType].key);
    } catch (err) {
      console.error(err);
    } finally {
      isFetching = false;
    }
  };
  activeFetchFn();
}

/* ======================== CRUD Actions ======================== */

async function handleAdd() {
  const data = getFormData("add");

  if (!data[CONFIG[currentType].nameField])
    return showMessage(DOM.addMsg, "نام الزامی است", false);

  if (data.firstPhone && !validatePhone(data.firstPhone))
    return showMessage(DOM.addMsg, "شماره موبایل اول معتبر نیست", false);

  if (data.secoundPhone && !validatePhone(data.secoundPhone))
    return showMessage(DOM.addMsg, "شماره تماس دوم معتبر نیست", false);

  const res = await fetchHandler(
    CONFIG[currentType].url,
    "post",
    JSON.stringify(data),
    { "content-type": "application/json" }
  );

  if (res?.success) {
    showMessage(DOM.addMsg, res.message || "با موفقیت ثبت شد ✅");
    setTimeout(() => location.reload(), 2000);
  } else {
    showMessage(DOM.addMsg, res?.error || res?.message || "خطا در ثبت", false);
  }
}

async function handleUpdate() {
  const id = DOM.removeBtn.dataset.id;
  const data = getFormData("edit");
  if (!id) return;

  if (data.firstPhone && !validatePhone(data.firstPhone))
    return showMessage(DOM.updateMsg, "فرمت شماره جدید معتبر نیست", false);

  if (data.secoundPhone && !validatePhone(data.secoundPhone))
    return showMessage(DOM.updateMsg, "فرمت شماره دوم معتبر نیست", false);

  try {
    const res = await fetchHandler(
      `${CONFIG[currentType].url}/${id}`,
      "put",
      JSON.stringify(data),
      { "content-type": "application/json" }
    );
    if (res?.success || res) {
      showMessage(
        DOM.updateMsg,
        res.message || "تغییرات با موفقیت اعمال شد ✅"
      );
      setTimeout(() => location.reload(), 2000);
    }
  } catch (err) {
    showMessage(
      DOM.updateMsg,
      err.response.data.error || "خطا در ویرایش",
      false
    );
  }
}

/* ======================== CRUD Actions ======================== */

async function handleDelete() {
  const isConfirmed = await showConfirm("آیا از حذف این مورد اطمینان دارید؟");

  if (isConfirmed) {
    const id = DOM.removeBtn.dataset.id;
    const res = await fetchHandler(
      `${CONFIG[currentType].url}/${id}`,
      "delete"
    );
    if (res?.success) {
      location.reload();
    }
  }
}

/* ======================== Helpers & Profile ======================== */

function getFormData(mode) {
  const f = DOM.fields[mode];
  return {
    [CONFIG[currentType].nameField]: f.name.value,
    firstPhone: f.p1.value,
    secoundPhone: f.p2.value,
    address: f.addr.value,
  };
}

function validatePhone(phone) {
  return /^09\d{9}$/.test(phone);
}

async function openProfile(e) {
  const card = e.target.closest(".customer");
  if (!card) return;
  const id = card.id;

  try {
    const res = await fetchHandler(`${CONFIG[currentType].url}/${id}`, "get");

    let item = null;
    if (currentType === "sellers") item = res.seller;
    else if (currentType === "representation") item = res.representation;
    else item = res;

    if (item) {
      const name = item.fullName || item.name || "";
      $("#fullName").textContent = name;
      $("#firstPhone").textContent = item.firstPhone || "---";
      $("#secoundPhone").textContent = item.secoundPhone || "---";
      $("#address").textContent = item.address || "---";

      DOM.fields.edit.name.value = name;
      DOM.fields.edit.p1.value = item.firstPhone || "";
      DOM.fields.edit.p2.value = item.secoundPhone || "";
      DOM.fields.edit.addr.value = item.address || "";

      DOM.removeBtn.dataset.id = id;
      DOM.profileBox.classList.add("active");
    }
  } catch (err) {
    console.error("Profile load error", err);
  }
}

function initTabs() {
  DOM.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      DOM.tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentType = tab.classList.contains("Agencies")
        ? "representation"
        : tab.classList.contains("Visitors")
        ? "sellers"
        : "customers";
      showData(currentType);
    });
  });
}

function setupToggle(btn, target, action) {
  btn?.addEventListener("click", () => target.classList[action]("active"));
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

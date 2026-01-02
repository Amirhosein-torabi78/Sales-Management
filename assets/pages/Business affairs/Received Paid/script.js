/** @format */

// Tab switching functionality
const paymentsTab = document.getElementById("paymentsTab");
const receiptsTab = document.getElementById("receiptsTab");

paymentsTab.addEventListener("click", () => {
  paymentsTab.classList.add("active");
  receiptsTab.classList.remove("active");
  // Update content for payments tab
  updateContent("payments");
});

receiptsTab.addEventListener("click", () => {
  receiptsTab.classList.add("active");
  paymentsTab.classList.remove("active");
  // Update content for receipts tab
  updateContent("receipts");
});

function updateContent(tab) {
  const emptyMessage = document.querySelector(".empty-message");
  if (tab === "payments") {
    emptyMessage.textContent = "به نظر میاد هنوز پرداختی ثبت نکردید.";
  } else {
    emptyMessage.textContent = "به نظر میاد هنوز دریافتی ثبت نکردید.";
  }
}

// Header button interactions
document.getElementById("backBtn").addEventListener("click", () => {
  console.log("Back button clicked");
  // Add your back navigation logic here
});

document.getElementById("searchBtn").addEventListener("click", () => {
  console.log("Search button clicked");
  // Add your search functionality here
});

document.getElementById("helpBtn").addEventListener("click", () => {
  console.log("Help button clicked");
  alert("راهنمای استفاده از برنامه");
  // Add your help functionality here
});

// Floating Action Button
document.getElementById("addBtn").addEventListener("click", () => {
  console.log("Add button clicked");
  const activeTab = receiptsTab.classList.contains("active")
    ? "receipts"
    : "payments";
  alert(`افزودن ${activeTab === "receipts" ? "دریافتی" : "پرداختی"} جدید`);
  // Add your add item functionality here
});

// Update summary values (example function)
function updateSummary(total, cash, check) {
  document.getElementById("totalValue").textContent =
    total.toLocaleString("fa-IR");
  document.getElementById("cashValue").textContent =
    cash.toLocaleString("fa-IR");
  document.getElementById("checkValue").textContent =
    check.toLocaleString("fa-IR");
}

// Initialize with zero values
updateSummary(0, 0, 0);

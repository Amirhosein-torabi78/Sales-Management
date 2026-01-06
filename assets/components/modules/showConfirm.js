/** @format */

/* ======================== Custom Confirm Module ======================== */

const showConfirm = (message = "آیا از انجام این عملیات مطمئن هستید؟") => {
  return new Promise((resolve) => {
   
    const modalHtml = `
      <div class="modal-confirm" id="confirmModal">
        <div class="modal-content">
          <div class="modal-icon">⚠️</div>
          <h4>تایید عملیات</h4>
          <p id="confirmMessage">${message}</p>
          <div class="modal-actions">
            <button id="confirmYes" class="btn-confirm-danger">بله، حذف شود</button>
            <button id="confirmNo" class="btn-confirm-secondary">انصراف</button>
          </div>
        </div>
      </div>
    `;

   
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.querySelector("#confirmModal");
    const yesBtn = document.querySelector("#confirmYes");
    const noBtn = document.querySelector("#confirmNo");

   
    setTimeout(() => modal.classList.add("active"), 10);

  
    const closeModal = (result) => {
      modal.classList.remove("active");
      setTimeout(() => {
        modal.remove();
        resolve(result);
      }, 300);
    };

    yesBtn.onclick = () => closeModal(true);
    noBtn.onclick = () => closeModal(false);

    // بستن مدال با کلیک روی پس‌زمینه
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(false);
    };
  });
};

export default showConfirm;

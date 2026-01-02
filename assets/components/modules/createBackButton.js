/** @format */
function createBackButton(selector) {
  if (!selector) {
    console.error("createBackButton: selector الزامی است");
    return;
  }

  const btn = document.querySelector(selector);
  if (!btn) return;

  const updateState = () => {
    btn.disabled = window.history.length <= 1;
  };

  const handleClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  updateState();
  btn.addEventListener("click", handleClick);

  return {
    remove: () => btn.removeEventListener("click", handleClick),
    refresh: updateState,
  };
}
export default createBackButton;

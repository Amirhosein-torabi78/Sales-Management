/** @format */
function handleGridNavigation(
  containerSelector,
  itemselector,
  basePath = ".."
) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.addEventListener("click", (event) => {
    const item = event.target.closest(itemselector);
    if (!item) return;

    const target = item.dataset.text;
    if (!target) return;

    window.location.href = `${basePath}/${target}/index.html`;
  });
}
export default handleGridNavigation;

/** @format */
function appendHtml(container, html) {
  if (!container || typeof html !== "string") return;

  const fragment = document.createDocumentFragment();
  const temp = document.createElement("div");

  temp.innerHTML = html;

  while (temp.firstChild) {
    fragment.appendChild(temp.firstChild);
  }

  container.appendChild(fragment);
}

export default appendHtml;

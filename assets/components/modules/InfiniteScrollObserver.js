/** @format
/**
 * کامپوننت عمومی برای مشاهده آخرین آیتم و اجرای callback
 * @param {HTMLElement} container عنصر والد که آیتم‌ها داخلش هستند
 * @param {string} itemSelector سلکتور آیتم‌ها داخل container
 * @param {Function} callback فانکشن برای load آیتم‌های بعدی
 * @param {number} threshold درصد دیده شدن آیتم برای trigger شدن (0 تا 1)
 */
function InfiniteScrollObserver({
  container,
  itemSelector,
  callback,
  threshold = 0.8,
}) {
  if (!container || typeof callback !== "function") {
    console.error("InfiniteScrollObserver: container و callback الزامی هستند");
    return;
  }

  let observer = null;

  const observeLastItem = () => {
    if (observer) observer.disconnect();

    const items = container.querySelectorAll(itemSelector);
    const lastItem = items[items.length - 1];
    if (!lastItem) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { threshold }
    );

    observer.observe(lastItem);
  };

  return {
    observe: observeLastItem,
    disconnect: () => observer && observer.disconnect(),
    unobserve: () => observer && observer.disconnect(),
  };
}

export default InfiniteScrollObserver;

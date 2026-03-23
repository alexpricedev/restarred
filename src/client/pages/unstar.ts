export function init() {
  const closeButton = document.querySelector<HTMLButtonElement>(
    "[data-close-window]",
  );
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      window.close();
    });
  }
}

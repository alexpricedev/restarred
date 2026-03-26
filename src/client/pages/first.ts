import { confetti } from "@client/confetti";

function setupConsentCheckbox() {
  const checkbox = document.querySelector<HTMLInputElement>(
    "[data-consent-checkbox]",
  );
  if (!checkbox) return;

  const buttons = document.querySelectorAll<HTMLButtonElement>(
    ".first-actions button",
  );
  const hiddenFields = document.querySelectorAll<HTMLInputElement>(
    "[data-consent-field]",
  );

  checkbox.addEventListener("change", () => {
    const checked = checkbox.checked;
    for (const btn of buttons) {
      btn.disabled = !checked;
    }
    for (const field of hiddenFields) {
      field.value = checked ? "on" : "";
    }
  });
}

function resetButton(btn: HTMLButtonElement | null) {
  if (btn) {
    btn.textContent = "SEND MY FIRST DIGEST NOW";
    btn.disabled = false;
  }
}

function setupSendForm() {
  const form = document.querySelector<HTMLFormElement>("[data-send-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const btn = form.querySelector<HTMLButtonElement>(".first-btn-primary");
    if (btn) {
      btn.textContent = "SENDING...";
      btn.disabled = true;
    }

    const formData = new FormData(form);

    fetch(form.action, {
      method: "POST",
      body: formData,
      redirect: "manual",
    })
      .then((res) => {
        if (res.type === "opaqueredirect" || res.ok) {
          showSuccess();
        } else {
          resetButton(btn);
        }
      })
      .catch(() => {
        resetButton(btn);
      });
  });
}

function showSuccess() {
  const initial = document.querySelector<HTMLElement>(".first-initial");
  const success = document.querySelector<HTMLElement>(".first-success");
  if (!initial || !success) return;

  setTimeout(() => {
    initial.classList.add("first-fade-out");

    setTimeout(() => {
      initial.hidden = true;
      success.hidden = false;
      success.classList.add("first-fade-in");
    }, 400);
  }, 3000);
}

export function init() {
  confetti("rain");
  setupConsentCheckbox();
  setupSendForm();
}

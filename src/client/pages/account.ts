export function init() {
  const form = document.querySelector<HTMLFormElement>(".account-form");
  const indicator = document.getElementById("unsaved-indicator");
  if (!form || !indicator) return;

  const initial = new FormData(form);
  const snapshot = new Map<string, FormDataEntryValue>();
  for (const [key, value] of initial.entries()) {
    snapshot.set(key, value);
  }

  const checkChanges = () => {
    const current = new FormData(form);
    let changed = false;
    for (const [key, value] of current.entries()) {
      if (snapshot.get(key) !== value) {
        changed = true;
        break;
      }
    }
    indicator.hidden = !changed;
  };

  form.addEventListener("input", checkChanges);
  form.addEventListener("change", checkChanges);
}

function createConfetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "first-confetti";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let width = canvas.width;
  let height = canvas.height;

  const shades = [
    "#000000",
    "#1a1c1c",
    "#3b3b3b",
    "#5e5e5e",
    "#ababab",
    "#c6c6c6",
    "#e2e2e2",
    "#ffffff",
  ];

  const pieces: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vy: number;
    vx: number;
    rotation: number;
    spin: number;
    opacity: number;
  }[] = [];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * width,
      y: Math.random() * -height,
      w: Math.random() * 6 + 4,
      h: Math.random() * 10 + 6,
      color: shades[Math.floor(Math.random() * shades.length)],
      vy: Math.random() * 2 + 1.5,
      vx: Math.random() * 1.5 - 0.75,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.12,
      opacity: 1,
    });
  }

  let fading = false;
  const startTime = performance.now();
  const fadeDuration = 1500;
  const fadeAfter = 2500;

  const onResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
  };

  function draw(now: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const elapsed = now - startTime;
    if (!fading && elapsed > fadeAfter) fading = true;

    let globalOpacity = 1;
    if (fading) {
      globalOpacity = Math.max(0, 1 - (elapsed - fadeAfter) / fadeDuration);
    }

    if (globalOpacity <= 0) {
      window.removeEventListener("resize", onResize);
      canvas.remove();
      return;
    }

    for (const p of pieces) {
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity * globalOpacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  window.addEventListener("resize", onResize);
}

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
  createConfetti();
  setupConsentCheckbox();
  setupSendForm();
}

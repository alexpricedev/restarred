interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
}

type Mode = "rain" | "burst";

const RAIN_COLORS = [
  "#000000",
  "#1a1c1c",
  "#3b3b3b",
  "#5e5e5e",
  "#ababab",
  "#c6c6c6",
  "#e2e2e2",
  "#ffffff",
];

const BURST_COLORS = [
  "#22c55e",
  "#16a34a",
  "#4ade80",
  "#ef4444",
  "#dc2626",
  "#f87171",
  "#ffffff",
  "#e2e2e2",
];

const COUNT = 120;

function createPieces(mode: Mode, width: number, height: number): Piece[] {
  const pieces: Piece[] = [];
  const colors = mode === "burst" ? BURST_COLORS : RAIN_COLORS;
  for (let i = 0; i < COUNT; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const w = Math.random() * 6 + 4;
    const h = Math.random() * 10 + 6;
    const rotation = Math.random() * Math.PI * 2;
    const spin = (Math.random() - 0.5) * 0.12;

    if (mode === "rain") {
      pieces.push({
        x: Math.random() * width,
        y: Math.random() * -height,
        w,
        h,
        color,
        vy: Math.random() * 2 + 1.5,
        vx: Math.random() * 1.5 - 0.75,
        rotation,
        spin,
      });
    } else {
      pieces.push({
        x: width / 2,
        y: height / 2,
        w,
        h,
        color,
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * -14 - 4,
        rotation,
        spin,
      });
    }
  }
  return pieces;
}

export function confetti(mode: Mode = "rain") {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1000";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let width = canvas.width;
  let height = canvas.height;

  const pieces = createPieces(mode, width, height);
  const gravity = mode === "burst" ? 0.3 : 0;
  const startTime = performance.now();
  const fadeAfter = mode === "rain" ? 2500 : 1200;
  const fadeDuration = 1500;

  const onResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
  };
  window.addEventListener("resize", onResize);

  function draw(now: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const elapsed = now - startTime;
    const globalOpacity =
      elapsed > fadeAfter
        ? Math.max(0, 1 - (elapsed - fadeAfter) / fadeDuration)
        : 1;

    if (globalOpacity <= 0) {
      window.removeEventListener("resize", onResize);
      canvas.remove();
      return;
    }

    for (const p of pieces) {
      p.x += p.vx;
      p.vy += gravity;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = globalOpacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

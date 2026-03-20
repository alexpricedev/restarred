const POLL_INTERVAL = 2000;
const CONNECT_DELAY = 2000;

function setStepState(
  stepId: string,
  state: "pending" | "active" | "complete",
): void {
  const step = document.getElementById(stepId);
  if (!step) return;
  step.classList.remove("is-active", "is-complete");
  if (state === "active") step.classList.add("is-active");
  if (state === "complete") step.classList.add("is-complete");
}

export async function pollOnce(): Promise<boolean> {
  const response = await fetch("/api/stars/status");
  const data = (await response.json()) as { status: string; count: number };

  if (data.status === "done") {
    setStepState("step-fetch", "complete");
    setStepState("step-done", "active");
    const countEl = document.getElementById("sync-count");
    if (countEl) countEl.textContent = `${data.count} repos`;
    return true;
  }

  if (data.status === "error") {
    const label = document.querySelector("#step-fetch .welcome-step-label");
    if (label) {
      label.textContent = "Something went wrong. Please try signing in again.";
    }
    return true;
  }

  const countEl = document.getElementById("sync-count");
  if (countEl && data.count > 0) {
    countEl.textContent = `${data.count} repos found`;
  }

  return false;
}

export function init() {
  setTimeout(() => {
    setStepState("step-connect", "complete");
    setStepState("step-fetch", "active");

    const poll = async () => {
      const done = await pollOnce();
      if (done) {
        const doneStep = document.getElementById("step-done");
        if (doneStep?.classList.contains("is-active")) {
          setTimeout(() => {
            window.location.href = "/first";
          }, 1500);
        }
        return;
      }
      setTimeout(poll, POLL_INTERVAL);
    };

    poll();
  }, CONNECT_DELAY);
}

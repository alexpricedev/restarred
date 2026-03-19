const POLL_INTERVAL = 2000;

export async function pollOnce(): Promise<boolean> {
  const statusEl = document.getElementById("sync-status");
  const countEl = document.getElementById("sync-count");
  if (!statusEl) return true;

  const response = await fetch("/api/stars/status");
  const data = (await response.json()) as { status: string; count: number };

  if (data.status === "done") {
    statusEl.textContent = `Done! Found ${data.count} repos.`;
    if (countEl) countEl.textContent = "";
    return true;
  }

  if (data.status === "error") {
    statusEl.textContent = "Something went wrong. Please try signing in again.";
    if (countEl) countEl.textContent = "";
    return true;
  }

  statusEl.textContent = "Syncing your stars...";
  if (countEl && data.count > 0) {
    countEl.textContent = `${data.count} repos found so far`;
  }

  return false;
}

export function init() {
  const poll = async () => {
    const done = await pollOnce();
    if (done) {
      const statusEl = document.getElementById("sync-status");
      if (statusEl?.textContent?.startsWith("Done")) {
        setTimeout(() => {
          window.location.href = "/account";
        }, 1500);
      }
      return;
    }
    setTimeout(poll, POLL_INTERVAL);
  };

  poll();
}

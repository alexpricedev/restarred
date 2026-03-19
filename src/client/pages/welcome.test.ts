import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

describe("welcome page", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="sync-status">Connecting to GitHub...</span>
      <p id="sync-count"></p>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    mock.restore();
  });

  test("updates status text when syncing", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "syncing", count: 15 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { pollOnce } = await import("./welcome");
    const result = await pollOnce();

    expect(result).toBe(false);
    expect(document.getElementById("sync-status")?.textContent).toBe(
      "Syncing your stars...",
    );
    expect(document.getElementById("sync-count")?.textContent).toBe(
      "15 repos found so far",
    );
  });

  test("returns true when sync is done", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "done", count: 42 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { pollOnce } = await import("./welcome");
    const result = await pollOnce();

    expect(result).toBe(true);
    expect(document.getElementById("sync-status")?.textContent).toBe(
      "Done! Found 42 repos.",
    );
  });

  test("shows error state", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "error", count: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { pollOnce } = await import("./welcome");
    const result = await pollOnce();

    expect(result).toBe(true);
    expect(document.getElementById("sync-status")?.textContent).toBe(
      "Something went wrong. Please try signing in again.",
    );
  });
});

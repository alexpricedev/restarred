import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

describe("welcome page", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ol id="sync-steps">
        <li class="welcome-step is-active" id="step-connect">
          <span class="welcome-step-indicator"></span>
          <span class="welcome-step-label">Connecting to GitHub...</span>
        </li>
        <li class="welcome-step" id="step-fetch">
          <span class="welcome-step-indicator"></span>
          <span class="welcome-step-label">Fetching your starred repos...</span>
          <span class="welcome-step-count" id="sync-count"></span>
        </li>
        <li class="welcome-step" id="step-done">
          <span class="welcome-step-indicator"></span>
          <span class="welcome-step-label">All set! Redirecting...</span>
        </li>
      </ol>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    mock.restore();
  });

  test("updates sync-count when syncing with count > 0", async () => {
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
    expect(document.getElementById("sync-count")?.textContent).toBe(
      "15 repos found",
    );
  });

  test("marks step-done as active when status is done", async () => {
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
    expect(
      document.getElementById("step-done")?.classList.contains("is-active"),
    ).toBe(true);
    expect(
      document.getElementById("step-fetch")?.classList.contains("is-complete"),
    ).toBe(true);
    expect(document.getElementById("sync-count")?.textContent).toBe("42 repos");
  });

  test("shows error message on step-fetch label when status is error", async () => {
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
    const label = document.querySelector("#step-fetch .welcome-step-label");
    expect(label?.textContent).toBe(
      "Something went wrong. Please try signing in again.",
    );
  });

  test("init starts polling after CONNECT_DELAY", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: "syncing", count: 5 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { init } = await import("./welcome");
    init();

    await new Promise((r) => setTimeout(r, 2100));

    expect(mockFetch).toHaveBeenCalled();
    expect(
      document
        .getElementById("step-connect")
        ?.classList.contains("is-complete"),
    ).toBe(true);
    expect(
      document.getElementById("step-fetch")?.classList.contains("is-active"),
    ).toBe(true);
  });
});

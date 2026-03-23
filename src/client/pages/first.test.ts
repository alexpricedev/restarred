import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const DOM_FIXTURE = `
  <div class="first-content">
    <div class="first-initial">
      <span class="first-label">SYNC COMPLETE</span>
      <h1 class="first-heading">42 REPOS READY</h1>
      <p class="first-description">Each week, we'll email you 3 forgotten starred repos.</p>
      <div class="first-consent">
        <label class="first-consent-checkbox">
          <span>I agree to receive weekly digest emails from re:starred.</span>
          <input type="checkbox" data-consent-checkbox />
        </label>
      </div>
      <div class="first-actions">
        <form method="POST" action="/first/send" data-send-form>
          <input type="hidden" name="_csrf" value="mock-token" />
          <input type="hidden" name="consent" value="" data-consent-field />
          <button type="submit" class="first-btn first-btn-primary" disabled>SEND MY FIRST DIGEST NOW</button>
        </form>
        <form method="POST" action="/first/skip">
          <input type="hidden" name="_csrf" value="mock-token" />
          <input type="hidden" name="consent" value="" data-consent-field />
          <button type="submit" class="first-btn first-btn-secondary" disabled>I'll wait for my regular digest</button>
        </form>
      </div>
    </div>
    <div class="first-success" hidden>
      <span class="first-label">DIGEST SENT</span>
      <h1 class="first-heading">CHECK YOUR INBOX</h1>
      <div class="first-actions">
        <a href="/account" class="first-btn first-btn-primary">GO TO MY ACCOUNT</a>
      </div>
    </div>
  </div>
`;

function getForm(): HTMLFormElement {
  const form = document.querySelector<HTMLFormElement>("[data-send-form]");
  if (!form) throw new Error("form not found");
  return form;
}

function getBtn(form: HTMLFormElement): HTMLButtonElement {
  const btn = form.querySelector<HTMLButtonElement>(".first-btn-primary");
  if (!btn) throw new Error("button not found");
  return btn;
}

function submitForm(form: HTMLFormElement) {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("first page", () => {
  beforeEach(() => {
    document.body.innerHTML = DOM_FIXTURE;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    mock.restore();
  });

  test("submit disables button and sends fetch to form action", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { init } = await import("./first");
    init();

    const form = getForm();
    submitForm(form);

    await new Promise((r) => setTimeout(r, 50));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const btn = getBtn(form);
    expect(btn.textContent).toBe("SENDING...");
    expect(btn.disabled).toBe(true);
  });

  test("shows success state after successful response", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { init } = await import("./first");
    init();

    submitForm(getForm());

    // Wait for fetch resolve + 3s showSuccess delay + 400ms fade
    await new Promise((r) => setTimeout(r, 4000));

    const initial = document.querySelector<HTMLElement>(".first-initial");
    const success = document.querySelector<HTMLElement>(".first-success");
    expect(initial?.hidden).toBe(true);
    expect(success?.hidden).toBe(false);
    expect(success?.classList.contains("first-fade-in")).toBe(true);
  }, 10000);

  test("resets button on network error", async () => {
    const mockFetch = mock(() => Promise.reject(new Error("Network error")));
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { init } = await import("./first");
    init();

    const form = getForm();
    const btn = getBtn(form);

    submitForm(form);

    await new Promise((r) => setTimeout(r, 50));

    expect(btn.textContent).toBe("SEND MY FIRST DIGEST NOW");
    expect(btn.disabled).toBe(false);
  });

  test("resets button on server error response", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(new Response("Server Error", { status: 500 })),
    );
    // @ts-expect-error mock global fetch
    globalThis.fetch = mockFetch;

    const { init } = await import("./first");
    init();

    const form = getForm();
    const btn = getBtn(form);

    submitForm(form);

    await new Promise((r) => setTimeout(r, 50));

    expect(btn.textContent).toBe("SEND MY FIRST DIGEST NOW");
    expect(btn.disabled).toBe(false);
  });

  test("buttons start disabled and enable when consent checkbox is checked", async () => {
    const { init } = await import("./first");
    init();

    const checkbox = document.querySelector<HTMLInputElement>(
      "[data-consent-checkbox]",
    );
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      ".first-actions button",
    );
    const hiddenFields = document.querySelectorAll<HTMLInputElement>(
      "[data-consent-field]",
    );

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);

    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change"));
    }

    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(false);
    expect(hiddenFields[0].value).toBe("on");
    expect(hiddenFields[1].value).toBe("on");
  });

  test("buttons re-disable when consent checkbox is unchecked", async () => {
    const { init } = await import("./first");
    init();

    const checkbox = document.querySelector<HTMLInputElement>(
      "[data-consent-checkbox]",
    );
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      ".first-actions button",
    );

    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change"));
      expect(buttons[0].disabled).toBe(false);

      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change"));
    }
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});

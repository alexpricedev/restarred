import { describe, expect, mock, test } from "bun:test";

const mockUser = {
  id: "user-123",
  github_id: 12345,
  github_username: "testuser",
  github_name: null,
  github_email: "test@example.com",
  email_override: null,
  github_token: "encrypted-token",
  digest_day: 1,
  digest_hour: 9,
  timezone: "UTC",
  is_active: true,
  consented_to_emails: false,
  consented_at: null,
  role: "user",
  filter_own_repos: true,
  sync_status: "done",
  created_at: new Date(),
  updated_at: new Date(),
};

mock.module("../../middleware/auth", () => ({
  getSessionContext: mock(() =>
    Promise.resolve({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: { ...mockUser },
      isGuest: false,
      isAuthenticated: true,
      requiresSetCookie: false,
    }),
  ),
}));

mock.module("../../services/sessions", () => ({
  setSessionCookie: mock(() => {}),
}));

mock.module("../../services/stars", () => ({
  getStarCount: mock(() => Promise.resolve(42)),
}));

mock.module("../../services/csrf", () => ({
  createCsrfToken: mock(() => Promise.resolve("mock-csrf-token")),
}));

mock.module("../../middleware/csrf", () => ({
  csrfProtection: mock(() => Promise.resolve(null)),
}));

mock.module("../../services/users", () => ({
  recordConsent: mock(() => Promise.resolve()),
}));

mock.module("../../services/unsubscribe", () => ({
  generateUnsubscribeToken: mock(() => "mock-unsubscribe-token"),
}));

mock.module("../../services/digest", () => ({
  selectReposForDigest: mock(() => Promise.resolve([])),
  recordDigestSelections: mock(() => Promise.resolve()),
}));

mock.module("../../services/digest-email", () => ({
  renderDigestEmail: mock(() => ({
    subject: "Test Subject",
    html: "<p>Test</p>",
    text: "Test",
    headers: {
      "List-Unsubscribe": "<http://localhost:3000/unsubscribe?token=first>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  })),
}));

mock.module("../../services/email", () => ({
  getEmailService: mock(() => ({
    send: mock(() => Promise.resolve()),
  })),
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { first } from "./first";

describe("First Controller", () => {
  test("renders first page with consent checkbox and legal links", async () => {
    const request = createBunRequest("http://localhost:3000/first");
    const response = await first.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("SYNC COMPLETE");
    expect(html).toContain("42");
    expect(html).toContain("REPOS READY");
    expect(html).toContain("SEND MY FIRST DIGEST NOW");
    expect(html).toContain("wait for my regular digest");
    expect(html).toContain("data-consent-checkbox");
    expect(html).toContain("I agree to receive weekly digest emails");
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
  });

  test("redirects to /account if user has already consented", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: {
        ...mockUser,
        consented_to_emails: true,
        consented_at: new Date(),
      },
      isGuest: false,
      isAuthenticated: true,
      requiresSetCookie: false,
    });

    const request = createBunRequest("http://localhost:3000/first");
    const response = await first.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");
  });

  test("redirects to /welcome if sync_status is not done", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: { ...mockUser, sync_status: "syncing" },
      isGuest: false,
      isAuthenticated: true,
      requiresSetCookie: false,
    });

    const request = createBunRequest("http://localhost:3000/first");
    const response = await first.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/welcome");
  });

  test("redirects to / if not authenticated", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
      sessionId: null,
      sessionHash: null,
      sessionType: null,
      user: null,
      isGuest: true,
      isAuthenticated: false,
      requiresSetCookie: false,
    });

    const request = createBunRequest("http://localhost:3000/first");
    const response = await first.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  test("POST /first/skip with consent records consent and redirects", async () => {
    const formBody = new URLSearchParams({ consent: "on" }).toString();
    const request = createBunRequest("http://localhost:3000/first/skip", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await first.skip(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");

    const { recordConsent } = await import("../../services/users");
    expect(recordConsent).toHaveBeenCalled();
  });

  test("POST /first/skip without consent re-renders with error", async () => {
    const request = createBunRequest("http://localhost:3000/first/skip", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "",
    });
    const response = await first.skip(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("You must agree");
  });

  test("POST /first/send with consent sends email and redirects", async () => {
    const formBody = new URLSearchParams({ consent: "on" }).toString();
    const request = createBunRequest("http://localhost:3000/first/send", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await first.send(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");

    const { recordConsent } = await import("../../services/users");
    expect(recordConsent).toHaveBeenCalled();
  });

  test("POST /first/send without consent re-renders with error", async () => {
    const request = createBunRequest("http://localhost:3000/first/send", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "",
    });
    const response = await first.send(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("You must agree");
  });
});

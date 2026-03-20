import { describe, expect, mock, test } from "bun:test";

const mockUser = {
  id: "user-123",
  github_id: 12345,
  github_username: "testuser",
  github_email: "test@example.com",
  email_override: null,
  github_token: "encrypted-token",
  digest_day: 1,
  digest_hour: 9,
  timezone: "UTC",
  is_active: true,
  role: "user",
  filter_own_repos: true,
  has_viewed_first: false,
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
  markFirstViewed: mock(() => Promise.resolve()),
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
  test("renders first page for authenticated user with sync done and has_viewed_first false", async () => {
    const request = createBunRequest("http://localhost:3000/first");
    const response = await first.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("SYNC COMPLETE");
    expect(html).toContain("42");
    expect(html).toContain("REPOS READY");
    expect(html).toContain("SEND MY FIRST DIGEST NOW");
    expect(html).toContain("wait for my regular digest");
  });

  test("redirects to /account if has_viewed_first is true", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: { ...mockUser, has_viewed_first: true },
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

  test("POST /first/skip marks first as viewed and redirects", async () => {
    const request = createBunRequest("http://localhost:3000/first/skip", {
      method: "POST",
    });
    const response = await first.skip(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");

    const { markFirstViewed } = await import("../../services/users");
    expect(markFirstViewed).toHaveBeenCalledWith("user-123");
  });

  test("POST /first/send sends email, marks viewed, and redirects", async () => {
    const request = createBunRequest("http://localhost:3000/first/send", {
      method: "POST",
    });
    const response = await first.send(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");

    const { markFirstViewed } = await import("../../services/users");
    expect(markFirstViewed).toHaveBeenCalledWith("user-123");
  });
});

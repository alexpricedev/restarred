import { describe, expect, mock, test } from "bun:test";

mock.module("../../middleware/auth", () => ({
  getSessionContext: mock(() =>
    Promise.resolve({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: {
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
        filter_own_repos: true,
        has_viewed_first: false,
        role: "user",
        sync_status: "done",
        created_at: new Date(),
        updated_at: new Date(),
      },
      isGuest: false,
      isAuthenticated: true,
      requiresSetCookie: false,
    }),
  ),
}));

mock.module("../../services/sessions", () => ({
  clearSessionCookie: mock(() => {}),
  setSessionCookie: mock(() => {}),
}));

mock.module("../../middleware/csrf", () => ({
  csrfProtection: mock(() => Promise.resolve(null)),
}));

mock.module("../../services/csrf", () => ({
  createCsrfToken: mock(() => Promise.resolve("mock-csrf-token")),
}));

mock.module("../../services/users", () => ({
  deleteUser: mock(() => Promise.resolve(true)),
}));

mock.module("../../services/logger", () => ({
  log: { info: mock(() => {}), warn: mock(() => {}), error: mock(() => {}) },
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { deleteAccount } from "./delete-account";

describe("Delete Account Controller", () => {
  test("GET renders confirmation page for authenticated user", async () => {
    const request = createBunRequest("http://localhost:3000/account/delete");
    const response = await deleteAccount.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Delete your account");
    expect(html).toContain("testuser");
  });

  test("GET redirects unauthenticated user to /", async () => {
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

    const request = createBunRequest("http://localhost:3000/account/delete");
    const response = await deleteAccount.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  test("POST deletes user and redirects to / with flash", async () => {
    const formBody = new URLSearchParams({
      _csrf: "mock-token",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await deleteAccount.destroy(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");

    const { deleteUser } = await import("../../services/users");
    expect(deleteUser).toHaveBeenCalledWith("user-123");

    const { clearSessionCookie } = await import("../../services/sessions");
    expect(clearSessionCookie).toHaveBeenCalled();
  });

  test("POST redirects unauthenticated user to /", async () => {
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

    const formBody = new URLSearchParams({ _csrf: "mock-token" }).toString();
    const request = createBunRequest("http://localhost:3000/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await deleteAccount.destroy(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });
});

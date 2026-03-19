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
        role: "user",
        sync_status: "syncing",
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
  setSessionCookie: mock(() => {}),
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { welcome } from "./welcome";

describe("Welcome Controller", () => {
  test("renders welcome page for authenticated user", async () => {
    const request = createBunRequest("http://localhost:3000/welcome");
    const response = await welcome.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("welcome");
    expect(html).toContain("TESTUSER");
  });

  test("redirects unauthenticated user to /login", async () => {
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

    const request = createBunRequest("http://localhost:3000/welcome");
    const response = await welcome.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });
});

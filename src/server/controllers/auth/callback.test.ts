import { describe, expect, mock, test } from "bun:test";

mock.module("../../services/auth", () => ({
  findOrCreateGitHubUser: mock(() =>
    Promise.resolve({
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
      created_at: new Date(),
      updated_at: new Date(),
    }),
  ),
}));

mock.module("../../services/encryption", () => ({
  encrypt: mock(() => "encrypted-access-token"),
}));

mock.module("../../services/sessions", () => ({
  createAuthenticatedSession: mock(() => Promise.resolve("new-session-id")),
  deleteSession: mock(() => Promise.resolve(true)),
  setSessionCookie: mock(() => {}),
}));

mock.module("../../middleware/auth", () => ({
  getSessionContext: mock(() =>
    Promise.resolve({
      sessionId: null,
      sessionHash: null,
      sessionType: null,
      user: null,
      isGuest: false,
      isAuthenticated: false,
      requiresSetCookie: false,
    }),
  ),
}));

const mockSyncUserStars = mock(() => Promise.resolve());

mock.module("../../services/stars", () => ({
  syncUserStars: mockSyncUserStars,
}));

const mockExchangeCodeForToken = mock(() => Promise.resolve("gh-token-123"));
const mockFetchGitHubUser = mock(() =>
  Promise.resolve({
    id: 12345,
    login: "testuser",
    email: "test@example.com",
  }),
);

mock.module("../../services/github-api", () => ({
  exchangeCodeForToken: mockExchangeCodeForToken,
  fetchGitHubUser: mockFetchGitHubUser,
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { callback } from "./callback";

describe("Callback Controller", () => {
  describe("GET /auth/callback", () => {
    test("redirects with error for missing code parameter", async () => {
      const request = createBunRequest(
        "http://localhost:3000/auth/callback?state=abc",
        { method: "GET" },
      );

      const response = await callback.index(request);

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(
        "/login?error=missing_params",
      );
    });

    test("redirects with error for missing state parameter", async () => {
      const request = createBunRequest(
        "http://localhost:3000/auth/callback?code=abc",
        { method: "GET" },
      );

      const response = await callback.index(request);

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(
        "/login?error=missing_params",
      );
    });

    test("redirects with error for missing state cookie", async () => {
      const request = createBunRequest(
        "http://localhost:3000/auth/callback?code=abc&state=xyz",
        { method: "GET" },
      );

      const response = await callback.index(request);

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain(
        "/login?error=state_mismatch",
      );
    });

    test("redirects with error for mismatched state", async () => {
      const request = createBunRequest(
        "http://localhost:3000/auth/callback?code=abc&state=wrong",
        {
          method: "GET",
          headers: {
            cookie: "github_oauth_state=correct",
          },
        },
      );

      const response = await callback.index(request);

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toContain(
        "/login?error=state_mismatch",
      );
    });

    test("syncs stars after successful authentication", async () => {
      mockSyncUserStars.mockClear();

      const request = createBunRequest(
        "http://localhost:3000/auth/callback?code=valid-code&state=matching-state",
        {
          method: "GET",
          headers: {
            cookie: "github_oauth_state=matching-state",
          },
        },
      );

      await callback.index(request);

      expect(mockSyncUserStars).toHaveBeenCalledTimes(1);
      expect(mockSyncUserStars).toHaveBeenCalledWith(
        "user-123",
        "gh-token-123",
      );
    });

    test("successfully authenticates with valid code and state", async () => {
      const request = createBunRequest(
        "http://localhost:3000/auth/callback?code=valid-code&state=matching-state",
        {
          method: "GET",
          headers: {
            cookie: "github_oauth_state=matching-state",
          },
        },
      );

      const response = await callback.index(request);

      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/");
    });
  });
});

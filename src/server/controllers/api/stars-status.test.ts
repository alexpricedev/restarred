import { describe, expect, mock, test } from "bun:test";
import type { SessionContext } from "../../services/sessions";

const mockGetSessionContext = mock(
  (): Promise<SessionContext> =>
    Promise.resolve({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: {
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
        consented_to_emails: true,
        consented_at: new Date(),
        filter_own_repos: true,
        role: "user",
        sync_status: "done",
        created_at: new Date(),
        updated_at: new Date(),
      },
      isGuest: false,
      isAuthenticated: true,
      requiresSetCookie: false,
    }),
);

mock.module("../../middleware/auth", () => ({
  getSessionContext: mockGetSessionContext,
}));

const mockGetSyncStatus = mock(() =>
  Promise.resolve({ status: "done", count: 42 }),
);

mock.module("../../services/stars", () => ({
  getSyncStatus: mockGetSyncStatus,
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { starsStatusApi } from "./stars-status";

describe("Stars Status API", () => {
  test("returns sync status and count for authenticated user", async () => {
    const request = createBunRequest("http://localhost:3000/api/stars/status");
    const response = await starsStatusApi.index(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ status: "done", count: 42 });
  });

  test("returns 401 for unauthenticated user", async () => {
    mockGetSessionContext.mockResolvedValueOnce({
      sessionId: null,
      sessionHash: null,
      sessionType: null,
      user: null,
      isGuest: true,
      isAuthenticated: false,
      requiresSetCookie: false,
    });

    const request = createBunRequest("http://localhost:3000/api/stars/status");
    const response = await starsStatusApi.index(request);

    expect(response.status).toBe(401);
  });
});

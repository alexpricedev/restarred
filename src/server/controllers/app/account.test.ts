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
  ),
}));

mock.module("../../services/sessions", () => ({
  setSessionCookie: mock(() => {}),
}));

mock.module("../../middleware/csrf", () => ({
  csrfProtection: mock(() => Promise.resolve(null)),
}));

mock.module("../../services/csrf", () => ({
  createCsrfToken: mock(() => Promise.resolve("mock-csrf-token")),
}));

mock.module("../../services/stars", () => ({
  getStarCount: mock(() => Promise.resolve(42)),
}));

mock.module("../../services/digest", () => ({
  getDigestCount: mock(() => Promise.resolve(1)),
  selectReposForDigest: mock(() => Promise.resolve([])),
}));

mock.module("../../services/users", () => ({
  updateUserPreferences: mock(() =>
    Promise.resolve({
      id: "user-123",
      github_id: 12345,
      github_username: "testuser",
      github_name: null,
      github_email: "test@example.com",
      email_override: "custom@example.com",
      github_token: "encrypted-token",
      digest_day: 3,
      digest_hour: 14,
      timezone: "America/New_York",
      is_active: true,
      consented_to_emails: true,
      consented_at: new Date(),
      filter_own_repos: true,
      role: "user",
      sync_status: "done",
      created_at: new Date(),
      updated_at: new Date(),
    }),
  ),
}));

const mockCreateVerification = mock(() => Promise.resolve());
const mockGetPendingVerification = mock(
  () =>
    Promise.resolve(null) as Promise<{
      email: string;
      createdAt: Date;
    } | null>,
);
const mockCancelPendingVerification = mock(() => Promise.resolve());
const mockVerifyPin = mock(
  () =>
    Promise.resolve({
      success: true,
      email: "verified@example.com",
    }) as Promise<{
      success: boolean;
      email?: string;
      reason?: "expired" | "invalid";
    }>,
);

mock.module("../../services/email-verification", () => ({
  createVerification: mockCreateVerification,
  getPendingVerification: mockGetPendingVerification,
  cancelPendingVerification: mockCancelPendingVerification,
  verifyPin: mockVerifyPin,
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "RateLimitError";
    }
  },
}));

mock.module("../../services/logger", () => ({
  log: { info: mock(() => {}), warn: mock(() => {}), error: mock(() => {}) },
}));

import { createBunRequest, findSetCookie } from "../../test-utils/bun-request";
import { account } from "./account";

describe("Account Controller", () => {
  test("GET renders account page for authenticated user", async () => {
    const request = createBunRequest("http://localhost:3000/account");
    const response = await account.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("testuser");
    expect(html).toContain("42");
    expect(html).toContain("account");
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

    const request = createBunRequest("http://localhost:3000/account");
    const response = await account.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  test("POST updates preferences and redirects", async () => {
    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "new@example.com",
      digest_day: "3",
      digest_hour: "14",
      timezone: "America/New_York",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
  });

  test("POST returns error for invalid email", async () => {
    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "not-an-email",
      digest_day: "0",
      digest_hour: "8",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Please enter a valid email address.");
  });

  test("GET redirects to /first if user has not consented", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
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
        is_active: false,
        consented_to_emails: false,
        consented_at: null,
        filter_own_repos: true,
        role: "user",
        sync_status: "done",
        created_at: new Date(),
        updated_at: new Date(),
      },
      isGuest: false,
      isAuthenticated: true,
      requiresSetCookie: false,
    });

    const request = createBunRequest("http://localhost:3000/account");
    const response = await account.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/first");
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

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  test("POST with new email triggers verification", async () => {
    mockCreateVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "new@example.com",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
    expect(mockCreateVerification).toHaveBeenCalledWith(
      "user-123",
      "new@example.com",
    );
  });

  test("POST with same email as current override skips verification", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: {
        id: "user-123",
        github_id: 12345,
        github_username: "testuser",
        github_email: "test@example.com",
        email_override: "existing@example.com",
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
    });
    mockCreateVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "existing@example.com",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(mockCreateVerification).not.toHaveBeenCalled();
  });

  test("POST with cleared email cancels pending verification", async () => {
    const { getSessionContext } = await import("../../middleware/auth");
    (getSessionContext as ReturnType<typeof mock>).mockResolvedValueOnce({
      sessionId: "session-123",
      sessionHash: "hash-123",
      sessionType: "authenticated",
      user: {
        id: "user-123",
        github_id: 12345,
        github_username: "testuser",
        github_email: "test@example.com",
        email_override: "old@example.com",
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
    });
    mockCancelPendingVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(mockCancelPendingVerification).toHaveBeenCalledWith("user-123");
  });

  test("POST with rate-limited verification shows error", async () => {
    const { RateLimitError } = await import(
      "../../services/email-verification"
    );
    mockCreateVerification.mockRejectedValueOnce(
      new RateLimitError("Rate limited"),
    );

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "new@example.com",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
  });

  test("GET shows pending verification in template", async () => {
    mockGetPendingVerification.mockResolvedValueOnce({
      email: "pending@example.com",
      createdAt: new Date(),
    });

    const request = createBunRequest("http://localhost:3000/account");
    const response = await account.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("pending@example.com");
    expect(html).toContain("Enter the 6-digit code we sent to");
    expect(html).toContain("/account/verify-pin");
  });

  test("POST resend-verification sends email", async () => {
    mockGetPendingVerification.mockResolvedValueOnce({
      email: "pending@example.com",
      createdAt: new Date(),
    });
    mockCreateVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.resendVerification(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
    expect(mockCreateVerification).toHaveBeenCalledWith(
      "user-123",
      "pending@example.com",
    );
  });

  test("POST resend-verification with no pending shows error", async () => {
    mockGetPendingVerification.mockResolvedValueOnce(null);

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.resendVerification(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
  });

  test("POST verify-pin with valid PIN redirects with success", async () => {
    mockVerifyPin.mockResolvedValueOnce({
      success: true,
      email: "verified@example.com",
    });

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      pin: "123456",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/verify-pin",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.verifyPin(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
    expect(mockVerifyPin).toHaveBeenCalledWith("123456");
  });

  test("POST verify-pin with invalid PIN redirects with error", async () => {
    mockVerifyPin.mockResolvedValueOnce({
      success: false,
      reason: "invalid",
    });

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      pin: "000000",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/verify-pin",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.verifyPin(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
  });

  test("POST verify-pin with expired PIN redirects with error", async () => {
    mockVerifyPin.mockResolvedValueOnce({
      success: false,
      reason: "expired",
    });

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      pin: "123456",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/verify-pin",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.verifyPin(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
  });

  test("POST verify-pin unauthenticated redirects to /", async () => {
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

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      pin: "123456",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/verify-pin",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.verifyPin(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  test("POST verify-pin sets flash on account-email cookie, not account", async () => {
    mockVerifyPin.mockResolvedValueOnce({
      success: true,
      email: "verified@example.com",
    });

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      pin: "123456",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/verify-pin",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    await account.verifyPin(request);

    expect(findSetCookie(request, "flash_account-email")).toBeDefined();
    expect(findSetCookie(request, "flash_account")).toBeUndefined();
  });

  test("POST preferences saved sets flash on account cookie, not account-email", async () => {
    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const response = await account.update(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");
    expect(findSetCookie(request, "flash_account")).toBeDefined();
    expect(findSetCookie(request, "flash_account-email")).toBeUndefined();
  });

  test("POST email change sets flash on account-email cookie", async () => {
    mockCreateVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
      email_override: "new@example.com",
      digest_day: "1",
      digest_hour: "9",
      timezone: "UTC",
      is_active: "true",
      filter_own_repos: "true",
    }).toString();

    const request = createBunRequest("http://localhost:3000/account", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    await account.update(request);

    expect(findSetCookie(request, "flash_account-email")).toBeDefined();
    expect(findSetCookie(request, "flash_account")).toBeUndefined();
  });

  test("POST cancel-verification cancels and redirects", async () => {
    mockCancelPendingVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/cancel-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    const response = await account.cancelVerification(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account#delivery-email");
    expect(mockCancelPendingVerification).toHaveBeenCalledWith("user-123");
    expect(findSetCookie(request, "flash_account-email")).toBeDefined();
  });

  test("GET with pending verification hides email input", async () => {
    mockGetPendingVerification.mockResolvedValueOnce({
      email: "pending@example.com",
      createdAt: new Date(),
    });

    const request = createBunRequest("http://localhost:3000/account");
    const response = await account.index(request);

    const html = await response.text();
    expect(html).toContain("Enter the 6-digit code we sent to");
    expect(html).not.toContain('id="email_override"');
  });

  test("GET without pending verification shows email input", async () => {
    mockGetPendingVerification.mockResolvedValueOnce(null);

    const request = createBunRequest("http://localhost:3000/account");
    const response = await account.index(request);

    const html = await response.text();
    expect(html).not.toContain("Enter the 6-digit code we sent to");
    expect(html).toContain('id="email_override"');
  });

  test("POST resend-verification sets flash on account-email cookie", async () => {
    mockGetPendingVerification.mockResolvedValueOnce({
      email: "pending@example.com",
      createdAt: new Date(),
    });
    mockCreateVerification.mockClear();

    const formBody = new URLSearchParams({
      _csrf: "mock-token",
    }).toString();

    const request = createBunRequest(
      "http://localhost:3000/account/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      },
    );
    await account.resendVerification(request);

    expect(findSetCookie(request, "flash_account-email")).toBeDefined();
    expect(findSetCookie(request, "flash_account")).toBeUndefined();
  });
});

import { describe, expect, mock, test } from "bun:test";

const mockVerifyToken = mock(
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
  verifyToken: mockVerifyToken,
}));

mock.module("../../services/logger", () => ({
  log: { info: mock(() => {}), warn: mock(() => {}), error: mock(() => {}) },
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { verifyEmail } from "./verify-email";

describe("Verify Email Controller", () => {
  test("valid token renders success page with email", async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: true,
      email: "new@example.com",
    });

    const request = createBunRequest(
      "http://localhost:3000/verify-email?token=valid-token",
    );
    const response = await verifyEmail.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("EMAIL VERIFIED");
    expect(html).toContain("new@example.com");
  });

  test("expired token renders expired page", async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: false,
      reason: "expired",
    });

    const request = createBunRequest(
      "http://localhost:3000/verify-email?token=expired-token",
    );
    const response = await verifyEmail.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("LINK EXPIRED");
  });

  test("invalid token renders invalid page", async () => {
    mockVerifyToken.mockResolvedValueOnce({
      success: false,
      reason: "invalid",
    });

    const request = createBunRequest(
      "http://localhost:3000/verify-email?token=bad-token",
    );
    const response = await verifyEmail.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("INVALID LINK");
  });

  test("missing token renders invalid page without calling service", async () => {
    mockVerifyToken.mockClear();

    const request = createBunRequest("http://localhost:3000/verify-email");
    const response = await verifyEmail.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("INVALID LINK");
    expect(mockVerifyToken).not.toHaveBeenCalled();
  });

  test("service error renders invalid page", async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error("DB connection failed"));

    const request = createBunRequest(
      "http://localhost:3000/verify-email?token=some-token",
    );
    const response = await verifyEmail.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("INVALID LINK");
  });
});

import { describe, expect, mock, test } from "bun:test";

mock.module("../../middleware/auth", () => ({
  getSessionContext: mock(() =>
    Promise.resolve({
      sessionId: null,
      sessionHash: null,
      sessionType: "guest",
      user: null,
      isGuest: true,
      isAuthenticated: false,
      requiresSetCookie: false,
    }),
  ),
}));

mock.module("../../services/csrf", () => ({
  createCsrfToken: mock(() => Promise.resolve("mock-csrf-token")),
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { privacy } from "./privacy";

describe("Privacy Controller", () => {
  test("renders privacy page", async () => {
    const request = createBunRequest("http://localhost:3000/privacy");
    const response = await privacy.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("PRIVACY POLICY");
    expect(html).toContain("Information We Collect");
    expect(html).toContain("Your Rights");
  });
});

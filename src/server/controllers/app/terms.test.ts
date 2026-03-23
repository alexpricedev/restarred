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
import { terms } from "./terms";

describe("Terms Controller", () => {
  test("renders terms page", async () => {
    const request = createBunRequest("http://localhost:3000/terms");
    const response = await terms.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("TERMS OF SERVICE");
    expect(html).toContain("Acceptance of Terms");
    expect(html).toContain("Email Communications");
  });
});

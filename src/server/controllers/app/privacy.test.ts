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
  test("renders privacy page with all required sections", async () => {
    const request = createBunRequest("http://localhost:3000/privacy");
    const response = await privacy.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("PRIVACY POLICY");
    expect(html).toContain("Who we are");
    expect(html).toContain("Information we collect");
    expect(html).toContain("How we use your information");
    expect(html).toContain("Legal basis for processing");
    expect(html).toContain("Cookies");
    expect(html).toContain("Data sharing and third parties");
    expect(html).toContain("Data retention and deletion");
    expect(html).toContain("Your rights");
    expect(html).toContain("International data transfers");
    expect(html).toContain("Age restriction");
    expect(html).toContain("Changes to this policy");
  });

  test("includes data controller contact", async () => {
    const request = createBunRequest("http://localhost:3000/privacy");
    const response = await privacy.index(request);
    const html = await response.text();

    expect(html).toContain("Alex Price");
    expect(html).toContain("restarred-privacy@alexprice.dev");
  });

  test("names third-party sub-processors", async () => {
    const request = createBunRequest("http://localhost:3000/privacy");
    const response = await privacy.index(request);
    const html = await response.text();

    expect(html).toContain("GitHub");
    expect(html).toContain("Resend");
  });
});

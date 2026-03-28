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
  test("renders terms page with all required sections", async () => {
    const request = createBunRequest("http://localhost:3000/terms");
    const response = await terms.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("TERMS OF SERVICE");
    expect(html).toContain("Acceptance of Terms");
    expect(html).toContain("Description of Service");
    expect(html).toContain("Your Account");
    expect(html).toContain("GitHub Integration");
    expect(html).toContain("Email Communications");
    expect(html).toContain("Data and Privacy");
    expect(html).toContain("Acceptable Use");
    expect(html).toContain("Intellectual Property");
    expect(html).toContain("Third-Party Services");
    expect(html).toContain("Service Availability");
    expect(html).toContain("Disclaimer of Warranties");
    expect(html).toContain("Limitation of Liability");
    expect(html).toContain("Indemnification");
    expect(html).toContain("Termination");
    expect(html).toContain("Governing Law");
    expect(html).toContain("Severability");
    expect(html).toContain("Changes to Terms");
    expect(html).toContain("Contact");
  });

  test("references privacy policy", async () => {
    const request = createBunRequest("http://localhost:3000/terms");
    const response = await terms.index(request);
    const html = await response.text();

    expect(html).toContain("/privacy");
  });

  test("names third-party services", async () => {
    const request = createBunRequest("http://localhost:3000/terms");
    const response = await terms.index(request);
    const html = await response.text();

    expect(html).toContain("GitHub");
    expect(html).toContain("Resend");
  });
});

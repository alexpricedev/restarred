import { describe, expect, mock, test } from "bun:test";

const mockDeactivateUser = mock(() => Promise.resolve());

mock.module("../../services/users", () => ({
  deactivateUser: mockDeactivateUser,
}));

mock.module("../../services/unsubscribe", () => ({
  verifyUnsubscribeToken: mock((token: string) => {
    if (token === "valid-token") return "user-123";
    return null;
  }),
}));

mock.module("../../services/logger", () => ({
  log: { info: mock(() => {}), warn: mock(() => {}), error: mock(() => {}) },
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { unsubscribe } from "./unsubscribe";

describe("Unsubscribe Controller", () => {
  describe("GET /unsubscribe", () => {
    test("renders confirmation page for valid token", async () => {
      const request = createBunRequest(
        "http://localhost:3000/unsubscribe?token=valid-token",
      );
      const response = await unsubscribe.index(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("UNSUBSCRIBE");
      expect(html).toContain("Confirm unsubscribe");
    });

    test("renders error page for invalid token", async () => {
      const request = createBunRequest(
        "http://localhost:3000/unsubscribe?token=bad-token",
      );
      const response = await unsubscribe.index(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("INVALID LINK");
    });

    test("renders error page for missing token", async () => {
      const request = createBunRequest("http://localhost:3000/unsubscribe");
      const response = await unsubscribe.index(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("INVALID LINK");
    });
  });

  describe("POST /unsubscribe", () => {
    test("deactivates user and shows success for valid token", async () => {
      const request = createBunRequest("http://localhost:3000/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=valid-token",
      });
      const response = await unsubscribe.confirm(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("UNSUBSCRIBED");
      expect(mockDeactivateUser).toHaveBeenCalledWith("user-123");
    });

    test("handles RFC 8058 one-click unsubscribe (List-Unsubscribe=One-Click)", async () => {
      const request = createBunRequest(
        "http://localhost:3000/unsubscribe?token=valid-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "List-Unsubscribe=One-Click",
        },
      );
      const response = await unsubscribe.confirm(request);

      expect(response.status).toBe(200);
      expect(mockDeactivateUser).toHaveBeenCalledWith("user-123");
    });

    test("renders error for invalid token on POST", async () => {
      const request = createBunRequest("http://localhost:3000/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=bad-token",
      });
      const response = await unsubscribe.confirm(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("INVALID LINK");
    });
  });
});

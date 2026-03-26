import { describe, expect, mock, test } from "bun:test";

const mockGetUserById = mock(() =>
  Promise.resolve({ github_token: "encrypted-token" }),
);
const mockUnstarRepo = mock(() => Promise.resolve(true));
const mockRemoveLocalStar = mock(() => Promise.resolve());
const mockTrackEvent = mock(() => Promise.resolve());

mock.module("../../services/unstar", () => ({
  verifyUnstarToken: mock((token: string) => {
    if (token === "valid-token")
      return { userId: "user-123", fullName: "owner/repo" };
    return null;
  }),
}));

mock.module("../../services/users", () => ({
  getUserById: mockGetUserById,
}));

mock.module("../../services/encryption", () => ({
  decrypt: mock(() => "decrypted-access-token"),
}));

mock.module("../../services/github-api", () => ({
  unstarRepo: mockUnstarRepo,
}));

mock.module("../../services/stars", () => ({
  removeLocalStar: mockRemoveLocalStar,
}));

mock.module("../../services/events", () => ({
  trackEvent: mockTrackEvent,
}));

mock.module("../../services/logger", () => ({
  log: { info: mock(() => {}), warn: mock(() => {}), error: mock(() => {}) },
}));

import { createBunRequest } from "../../test-utils/bun-request";
import { unstar } from "./unstar";

describe("Unstar Controller", () => {
  describe("GET /unstar", () => {
    test("renders confirmation page for valid token", async () => {
      const request = createBunRequest(
        "http://localhost:3000/unstar?token=valid-token",
      );
      const response = await unstar.index(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("UNSTAR");
      expect(html).toContain("owner/repo");
      expect(html).toContain("Confirm &amp; Unstar");
    });

    test("renders error page for invalid token", async () => {
      const request = createBunRequest(
        "http://localhost:3000/unstar?token=bad-token",
      );
      const response = await unstar.index(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("COULDN&#x27;T UNSTAR");
    });

    test("renders error page for missing token", async () => {
      const request = createBunRequest("http://localhost:3000/unstar");
      const response = await unstar.index(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("COULDN&#x27;T UNSTAR");
    });
  });

  describe("POST /unstar", () => {
    test("unstars repo and shows success for valid token", async () => {
      mockGetUserById.mockClear();
      mockUnstarRepo.mockClear();
      mockRemoveLocalStar.mockClear();

      const request = createBunRequest("http://localhost:3000/unstar", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=valid-token",
      });
      const response = await unstar.confirm(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("UNSTARRED");
      expect(html).toContain("owner/repo");
      expect(mockGetUserById).toHaveBeenCalledWith("user-123");
      expect(mockUnstarRepo).toHaveBeenCalledWith(
        "decrypted-access-token",
        "owner/repo",
      );
      expect(mockRemoveLocalStar).toHaveBeenCalledWith(
        "user-123",
        "owner/repo",
      );
    });

    test("renders error for invalid token on POST", async () => {
      const request = createBunRequest("http://localhost:3000/unstar", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=bad-token",
      });
      const response = await unstar.confirm(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("COULDN&#x27;T UNSTAR");
    });
  });
});

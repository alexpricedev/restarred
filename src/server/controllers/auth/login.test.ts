import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { createBunRequest } from "../../test-utils/bun-request";
import { cleanupTestData } from "../../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("../../services/database", () => ({
  get db() {
    return connection;
  },
}));

import { db } from "../../services/database";
import { login } from "./login";

describe("Login Controller", () => {
  beforeEach(async () => {
    await cleanupTestData(db);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  describe("GET /login", () => {
    test("renders login page for unauthenticated user", async () => {
      const request = createBunRequest("http://localhost:3000/login", {
        method: "GET",
      });
      const response = await login.index(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/html");
      expect(html).toContain("Sign in");
      expect(html).toContain("Sign in with GitHub");
      expect(html).toContain("/auth/github");
    });

    test("shows error message from query parameter", async () => {
      const request = createBunRequest(
        "http://localhost:3000/login?error=Authentication%20failed",
        { method: "GET" },
      );

      const response = await login.index(request);
      const html = await response.text();

      expect(html).toContain("An error occurred");
    });

    test("renders without error when no error param", async () => {
      const request = createBunRequest("http://localhost:3000/login", {
        method: "GET",
      });

      const response = await login.index(request);
      const html = await response.text();

      expect(html).toContain("Sign in");
      expect(html).not.toContain("login-error");
    });

    test("shows known error code message", async () => {
      const request = createBunRequest(
        "http://localhost:3000/login?error=github_denied",
        { method: "GET" },
      );

      const response = await login.index(request);
      const html = await response.text();

      expect(html).toContain("GitHub authorization was denied");
    });
  });
});

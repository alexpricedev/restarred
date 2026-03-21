import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { cleanupTestData, createTestUser } from "../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("../services/database", () => ({
  get db() {
    return connection;
  },
}));

import { db } from "../services/database";
import {
  createAuthenticatedSession,
  createGuestSession,
} from "../services/sessions";
import { createBunRequest } from "../test-utils/bun-request";
import { requireAdmin } from "./admin";

describe("Admin Middleware", () => {
  beforeEach(async () => {
    await cleanupTestData(db);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("returns authorized with session context for admin user", async () => {
    const user = await createTestUser(db, {
      githubEmail: "admin@example.com",
      role: "admin",
    });
    const sessionId = await createAuthenticatedSession(user.id);

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const result = await requireAdmin(request);
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.ctx.user?.github_email).toBe("admin@example.com");
      expect(result.ctx.user?.role).toBe("admin");
    }
  });

  test("redirects unauthenticated user to /", async () => {
    const request = createBunRequest("http://localhost:3000/admin");

    const result = await requireAdmin(request);

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(303);
      expect(result.response.headers.get("location")).toBe("/");
    }
  });

  test("redirects non-admin user to /", async () => {
    const user = await createTestUser(db, {
      githubEmail: "regular@example.com",
    });
    const sessionId = await createAuthenticatedSession(user.id);

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const result = await requireAdmin(request);

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(303);
      expect(result.response.headers.get("location")).toBe("/");
    }
  });

  test("redirects guest session to /", async () => {
    const sessionId = await createGuestSession();

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const result = await requireAdmin(request);

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(303);
      expect(result.response.headers.get("location")).toBe("/");
    }
  });
});

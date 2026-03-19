import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { cleanupTestData, createTestUser } from "../../test-utils/helpers";

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
import { createAuthenticatedSession } from "../../services/sessions";
import { createBunRequest } from "../../test-utils/bun-request";
import { admin } from "./dashboard";

describe("Admin Dashboard Controller", () => {
  beforeEach(async () => {
    await cleanupTestData(db);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("renders admin dashboard for admin user", async () => {
    const user = await createTestUser(db, {
      githubEmail: "admin@example.com",
      role: "admin",
    });
    const sessionId = await createAuthenticatedSession(user.id);

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const response = await admin.index(request);

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Admin");
    expect(html).toContain("admin@example.com");
  });

  test("redirects unauthenticated user to /login", async () => {
    const request = createBunRequest("http://localhost:3000/admin");

    const response = await admin.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });

  test("redirects non-admin user to /", async () => {
    const user = await createTestUser(db, {
      githubEmail: "regular@example.com",
    });
    const sessionId = await createAuthenticatedSession(user.id);

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const response = await admin.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });

  test("renders users table with user data", async () => {
    const adminUser = await createTestUser(db, {
      githubEmail: "admin@example.com",
      role: "admin",
    });
    await createTestUser(db, { githubEmail: "regular@example.com" });
    const sessionId = await createAuthenticatedSession(adminUser.id);

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const response = await admin.index(request);
    const html = await response.text();

    expect(html).toContain("admin@example.com");
    expect(html).toContain("regular@example.com");
    expect(html).toContain("admin");
    expect(html).toContain("user");
  });
});

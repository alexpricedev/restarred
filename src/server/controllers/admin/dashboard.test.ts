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

mock.module("../../middleware/auth", () => {
  const { computeHMAC } = require("../../utils/crypto");

  const SESSION_COOKIE_NAME = "session_id";

  return {
    getSessionContext: async (req: import("bun").BunRequest) => {
      const sessionId = req.cookies?.get(SESSION_COOKIE_NAME) || null;

      if (!sessionId) {
        const { randomUUID } = require("node:crypto");
        const rawId = randomUUID();
        const idHash = computeHMAC(rawId);
        const expiresAt = new Date(Date.now() + 86400000);
        await connection`
          INSERT INTO sessions (id_hash, session_type, expires_at)
          VALUES (${idHash}, 'guest', ${expiresAt.toISOString()})
        `;
        return {
          sessionId: rawId,
          sessionHash: null,
          sessionType: "guest",
          user: null,
          isGuest: true,
          isAuthenticated: false,
          requiresSetCookie: true,
        };
      }

      const sessionIdHash = computeHMAC(sessionId);
      const result = await connection`
        SELECT
          s.id_hash, s.user_id, s.session_type,
          u.id as user_id_result, u.github_id, u.github_username,
          u.github_email, u.email_override, u.github_token,
          u.digest_day, u.digest_hour, u.timezone, u.is_active,
          u.role, u.created_at as user_created_at, u.updated_at as user_updated_at
        FROM sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id_hash = ${sessionIdHash}
          AND s.expires_at > CURRENT_TIMESTAMP
      `;

      if (result.length === 0) {
        const { randomUUID } = require("node:crypto");
        const rawId = randomUUID();
        const idHash = computeHMAC(rawId);
        const expiresAt = new Date(Date.now() + 86400000);
        await connection`
          INSERT INTO sessions (id_hash, session_type, expires_at)
          VALUES (${idHash}, 'guest', ${expiresAt.toISOString()})
        `;
        return {
          sessionId: rawId,
          sessionHash: null,
          sessionType: "guest",
          user: null,
          isGuest: true,
          isAuthenticated: false,
          requiresSetCookie: true,
        };
      }

      const data = result[0] as Record<string, unknown>;
      const isAuthenticated =
        data.session_type === "authenticated" && data.user_id_result !== null;

      const user = isAuthenticated
        ? {
            id: data.user_id_result as string,
            github_id: data.github_id as number,
            github_username: data.github_username as string,
            github_email: data.github_email as string,
            email_override: data.email_override as string | null,
            github_token: data.github_token as string,
            digest_day: data.digest_day as number,
            digest_hour: data.digest_hour as number,
            timezone: data.timezone as string,
            is_active: data.is_active as boolean,
            role: (data.role as "user" | "admin") ?? "user",
            created_at: new Date(data.user_created_at as string),
            updated_at: new Date(data.user_updated_at as string),
          }
        : null;

      return {
        sessionId,
        sessionHash: data.id_hash as string,
        sessionType: data.session_type as string,
        user,
        isGuest: data.session_type === "guest",
        isAuthenticated,
        requiresSetCookie: false,
      };
    },
  };
});

import { randomUUID } from "node:crypto";
import { db } from "../../services/database";
import { trackEvent } from "../../services/events";
import { createBunRequest } from "../../test-utils/bun-request";
import { computeHMAC } from "../../utils/crypto";
import { admin } from "./dashboard";

const createAuthenticatedSession = async (userId: string): Promise<string> => {
  const rawSessionId = randomUUID();
  const sessionIdHash = computeHMAC(rawSessionId);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await connection`
    INSERT INTO sessions (id_hash, user_id, session_type, expires_at)
    VALUES (${sessionIdHash}, ${userId}, 'authenticated', ${expiresAt.toISOString()})
  `;
  return rawSessionId;
};

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
  });

  test("redirects unauthenticated user to /", async () => {
    const request = createBunRequest("http://localhost:3000/admin");

    const response = await admin.index(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
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

  test("renders stat cards with counts", async () => {
    const adminUser = await createTestUser(db, {
      githubEmail: "admin@example.com",
      role: "admin",
    });
    const user1 = await createTestUser(db, {
      githubEmail: "user1@example.com",
    });
    await db`UPDATE users SET is_active = true WHERE id = ${user1.id}`;
    const sessionId = await createAuthenticatedSession(adminUser.id);

    await trackEvent("signup", { role: "user" });
    await trackEvent("login", { role: "user" });
    await trackEvent("account_view", { role: "user" });
    await trackEvent(
      "settings_changed",
      { fields: ["email"] },
      { role: "user" },
    );
    await trackEvent("digest_sent", { role: "user" });
    await trackEvent("digest_failed", { role: "user" });
    await trackEvent("stars_synced", { count: 10 }, { role: "user" });
    await trackEvent("star_sync_failed", { role: "user" });
    await trackEvent("unsubscribe", { role: "user" });
    await trackEvent("resubscribe", { role: "user" });
    await trackEvent("homepage_view", { role: "user" });

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const response = await admin.index(request);
    const html = await response.text();

    expect(html).toContain("Lifetime signups");
    expect(html).toContain("Current users");
    expect(html).toContain("Signups this week");
    expect(html).toContain("Total logins");
    expect(html).toContain("Account views");
    expect(html).toContain("Settings changes");
    expect(html).toContain("Digests sent");
    expect(html).toContain("Digest failures");
    expect(html).toContain("Stars synced");
    expect(html).toContain("Sync failures");
    expect(html).toContain("Unsubscribes");
    expect(html).toContain("Resubscribes");
    expect(html).toContain("Homepage views");
  });

  test("renders role filter with user selected by default", async () => {
    const adminUser = await createTestUser(db, {
      githubEmail: "admin@example.com",
      role: "admin",
    });
    const sessionId = await createAuthenticatedSession(adminUser.id);

    const request = createBunRequest("http://localhost:3000/admin", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const response = await admin.index(request);
    const html = await response.text();

    expect(html).toContain("role-filter");
    expect(html).toContain('class="role-filter-link active"');
    expect(html).toContain("Users");
    expect(html).toContain("Admins");
    expect(html).toContain("Guests");
    expect(html).toContain("All");
  });

  test("accepts role query parameter", async () => {
    const adminUser = await createTestUser(db, {
      githubEmail: "admin@example.com",
      role: "admin",
    });
    const sessionId = await createAuthenticatedSession(adminUser.id);

    const request = createBunRequest("http://localhost:3000/admin?role=all", {
      headers: { cookie: `session_id=${sessionId}` },
    });

    const response = await admin.index(request);
    expect(response.status).toBe(200);
  });
});

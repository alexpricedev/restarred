import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import { SQL } from "bun";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("./database", () => ({
  get db() {
    return connection;
  },
}));

import { db } from "./database";

describe("auth service", () => {
  beforeEach(async () => {
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterEach(async () => {
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("findOrCreateGitHubUser creates a new user", async () => {
    const { findOrCreateGitHubUser } = await import("./auth");
    const result = await findOrCreateGitHubUser({
      githubId: 12345,
      githubUsername: "testuser",
      githubEmail: "test@example.com",
      encryptedToken: "encrypted:token:value",
    });

    expect(result.github_id).toBe(12345);
    expect(result.github_username).toBe("testuser");
    expect(result.github_email).toBe("test@example.com");
  });

  test("findOrCreateGitHubUser updates existing user on re-login", async () => {
    const { findOrCreateGitHubUser } = await import("./auth");
    await findOrCreateGitHubUser({
      githubId: 12345,
      githubUsername: "oldname",
      githubEmail: "old@example.com",
      encryptedToken: "encrypted:token:v1",
    });

    const updated = await findOrCreateGitHubUser({
      githubId: 12345,
      githubUsername: "newname",
      githubEmail: "new@example.com",
      encryptedToken: "encrypted:token:v2",
    });

    expect(updated.github_username).toBe("newname");
    expect(updated.github_email).toBe("new@example.com");

    const count =
      await db`SELECT COUNT(*) as c FROM users WHERE github_id = 12345`;
    expect(Number(count[0].c)).toBe(1);
  });

  test("cleanupExpired removes expired sessions", async () => {
    const { cleanupExpired } = await import("./auth");
    await cleanupExpired();
  });
});

import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { SQL } from "bun";
import { cleanupTestData } from "../test-utils/helpers";

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
import { getUsers, updateUserPreferences } from "./users";

beforeEach(async () => {
  await cleanupTestData(db);
});

afterAll(async () => {
  await cleanupTestData(db);
  await connection.end();
  mock.restore();
});

describe("Users Service", () => {
  test("returns empty array when no users exist", async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  test("returns all users with expected fields", async () => {
    const userId1 = randomUUID();
    const userId2 = randomUUID();
    await db`INSERT INTO users (id, github_id, github_username, github_email, role) VALUES (${userId1}, 1001, 'alice', 'alice@test.com', 'admin')`;
    await db`INSERT INTO users (id, github_id, github_username, github_email, role) VALUES (${userId2}, 1002, 'bob', 'bob@test.com', 'user')`;

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("github_email");
    expect(result[0]).toHaveProperty("role");
    expect(result[0]).toHaveProperty("created_at");
  });

  test("returns users ordered by created_at descending (newest first)", async () => {
    const userId1 = randomUUID();
    const userId2 = randomUUID();
    await db`INSERT INTO users (id, github_id, github_username, github_email, role, created_at) VALUES (${userId1}, 2001, 'first', 'first@test.com', 'user', '2026-01-01')`;
    await db`INSERT INTO users (id, github_id, github_username, github_email, role, created_at) VALUES (${userId2}, 2002, 'second', 'second@test.com', 'admin', '2026-03-01')`;

    const result = await getUsers();

    expect(result[0].github_email).toBe("second@test.com");
    expect(result[1].github_email).toBe("first@test.com");
  });
});

describe("updateUserPreferences", () => {
  test("updates all preference fields", async () => {
    const userId = randomUUID();
    await db`INSERT INTO users (id, github_id, github_username, github_email, role) VALUES (${userId}, 3001, 'prefuser', 'prefuser@test.com', 'user')`;

    const result = await updateUserPreferences(userId, {
      emailOverride: "custom@example.com",
      digestDay: 3,
      digestHour: 14,
      timezone: "America/New_York",
      isActive: false,
      filterOwnRepos: true,
    });

    expect(result.id).toBe(userId);
    expect(result.email_override).toBe("custom@example.com");
    expect(result.digest_day).toBe(3);
    expect(result.digest_hour).toBe(14);
    expect(result.timezone).toBe("America/New_York");
    expect(result.is_active).toBe(false);
  });

  test("sets email_override to null when empty string", async () => {
    const userId = randomUUID();
    await db`INSERT INTO users (id, github_id, github_username, github_email, role, email_override) VALUES (${userId}, 3002, 'nullemail', 'nullemail@test.com', 'user', 'old@example.com')`;

    const result = await updateUserPreferences(userId, {
      emailOverride: "",
      digestDay: 1,
      digestHour: 9,
      timezone: "UTC",
      isActive: true,
      filterOwnRepos: true,
    });

    expect(result.email_override).toBeNull();
  });

  test("throws for non-existent user", async () => {
    const fakeId = randomUUID();

    await expect(
      updateUserPreferences(fakeId, {
        emailOverride: "test@example.com",
        digestDay: 1,
        digestHour: 9,
        timezone: "UTC",
        isActive: true,
        filterOwnRepos: true,
      }),
    ).rejects.toThrow("User not found");
  });
});

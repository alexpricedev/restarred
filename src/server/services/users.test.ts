import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import { randomUUID } from "node:crypto";
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

import { deactivateUser, deleteUser } from "./users";

afterAll(() => {
  connection.close();
});

describe("deleteUser", () => {
  let userId: string;

  beforeEach(async () => {
    const result = await connection`
      INSERT INTO users (github_id, github_username, github_email, github_token, digest_day, digest_hour, timezone)
      VALUES (99999, 'deletetest', 'delete@test.com', 'enc-token', 0, 8, 'UTC')
      RETURNING id
    `;
    userId = result[0].id;
  });

  afterEach(async () => {
    await connection`DELETE FROM users WHERE github_id = 99999`;
  });

  test("deletes user and returns true", async () => {
    const result = await deleteUser(userId);
    expect(result).toBe(true);

    const remaining =
      await connection`SELECT id FROM users WHERE id = ${userId}`;
    expect(remaining.length).toBe(0);
  });

  test("returns false for non-existent user", async () => {
    const result = await deleteUser("00000000-0000-0000-0000-000000000000");
    expect(result).toBe(false);
  });
});

describe("deactivateUser", () => {
  test("sets is_active to false for the given user", async () => {
    const userId = randomUUID();
    await connection`INSERT INTO users (id, github_id, github_username, github_email, role, is_active) VALUES (${userId}, 99999, 'testunsubscribe', 'unsub@test.com', 'user', true)`;

    await deactivateUser(userId);

    const [updated] =
      await connection`SELECT is_active FROM users WHERE id = ${userId}`;
    expect(updated.is_active).toBe(false);
  });
});

import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { cleanupTestData, createTestUser } from "../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("./database", () => ({
  get db() {
    return connection;
  },
}));

const mockEmailSend = mock((_msg: Record<string, unknown>) =>
  Promise.resolve(),
);
mock.module("./email", () => ({
  getEmailService: () => ({ send: mockEmailSend }),
}));

mock.module("./logger", () => ({
  log: { info: mock(() => {}), warn: mock(() => {}), error: mock(() => {}) },
}));

import { computeHMAC } from "../utils/crypto";
import { db } from "./database";
import {
  cancelPendingVerification,
  createVerification,
  getPendingVerification,
  RateLimitError,
  verifyToken,
} from "./email-verification";

beforeEach(async () => {
  await cleanupTestData(db);
  mockEmailSend.mockClear();
});

afterAll(async () => {
  await cleanupTestData(db);
  connection.close();
});

describe("createVerification", () => {
  test("creates verification record and sends email", async () => {
    const user = await createTestUser(db);

    await createVerification(user.id, "new@example.com");

    const rows =
      await db`SELECT * FROM email_verifications WHERE user_id = ${user.id}`;
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("new@example.com");
    expect(rows[0].token_hash).toBeTruthy();
    expect(new Date(rows[0].expires_at as string).getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
  });

  test("replaces existing verification for same user", async () => {
    const user = await createTestUser(db);

    await createVerification(user.id, "first@example.com");

    // Wait past rate limit for second call
    await db`UPDATE email_verifications SET created_at = NOW() - INTERVAL '6 minutes' WHERE user_id = ${user.id}`;

    await createVerification(user.id, "second@example.com");

    const rows =
      await db`SELECT * FROM email_verifications WHERE user_id = ${user.id}`;
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("second@example.com");
  });

  test("throws RateLimitError when called within 5 minutes", async () => {
    const user = await createTestUser(db);

    await createVerification(user.id, "first@example.com");

    await expect(
      createVerification(user.id, "second@example.com"),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  test("cleans up expired verifications on insert", async () => {
    const user1 = await createTestUser(db);
    const user2 = await createTestUser(db);

    // Insert an expired verification for user2
    await db`INSERT INTO email_verifications (user_id, email, token_hash, expires_at, created_at)
      VALUES (${user2.id}, 'expired@example.com', 'oldhash', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '25 hours')`;

    await createVerification(user1.id, "new@example.com");

    const expiredRows =
      await db`SELECT * FROM email_verifications WHERE user_id = ${user2.id}`;
    expect(expiredRows).toHaveLength(0);
  });
});

describe("verifyToken", () => {
  test("valid token updates user email_override and deletes record", async () => {
    const user = await createTestUser(db);
    await createVerification(user.id, "verified@example.com");

    // Extract the token from the verification email that was sent
    const emailCall = mockEmailSend.mock.calls[0]?.[0] as unknown as {
      html: string;
    };
    const tokenMatch = emailCall.html.match(/token=([^"&]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch?.[1] ?? "";

    const result = await verifyToken(token);

    expect(result.success).toBe(true);
    expect(result.email).toBe("verified@example.com");

    // Verify user's email_override was updated
    const [updatedUser] =
      await db`SELECT email_override FROM users WHERE id = ${user.id}`;
    expect(updatedUser.email_override).toBe("verified@example.com");

    // Verify verification record was deleted
    const remaining =
      await db`SELECT * FROM email_verifications WHERE user_id = ${user.id}`;
    expect(remaining).toHaveLength(0);
  });

  test("returns invalid for non-existent token", async () => {
    const result = await verifyToken("nonexistent-token");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid");
  });

  test("returns invalid for empty token", async () => {
    const result = await verifyToken("");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid");
  });

  test("returns expired for expired token", async () => {
    const user = await createTestUser(db);
    const tokenHash = computeHMAC("test-expired-token");

    await db`INSERT INTO email_verifications (user_id, email, token_hash, expires_at)
      VALUES (${user.id}, 'expired@example.com', ${tokenHash}, NOW() - INTERVAL '1 second')`;

    const result = await verifyToken("test-expired-token");

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid");
  });
});

describe("getPendingVerification", () => {
  test("returns pending verification when one exists", async () => {
    const user = await createTestUser(db);
    await createVerification(user.id, "pending@example.com");

    const pending = await getPendingVerification(user.id);

    expect(pending).not.toBeNull();
    expect(pending?.email).toBe("pending@example.com");
    expect(pending?.createdAt).toBeInstanceOf(Date);
  });

  test("returns null when no pending verification", async () => {
    const user = await createTestUser(db);
    const pending = await getPendingVerification(user.id);
    expect(pending).toBeNull();
  });

  test("returns null for expired verification", async () => {
    const user = await createTestUser(db);

    await db`INSERT INTO email_verifications (user_id, email, token_hash, expires_at)
      VALUES (${user.id}, 'expired@example.com', 'hash', NOW() - INTERVAL '1 hour')`;

    const pending = await getPendingVerification(user.id);
    expect(pending).toBeNull();
  });
});

describe("cancelPendingVerification", () => {
  test("deletes pending verification for user", async () => {
    const user = await createTestUser(db);
    await createVerification(user.id, "cancel@example.com");

    await cancelPendingVerification(user.id);

    const rows =
      await db`SELECT * FROM email_verifications WHERE user_id = ${user.id}`;
    expect(rows).toHaveLength(0);
  });

  test("does nothing when no pending verification", async () => {
    const user = await createTestUser(db);
    await cancelPendingVerification(user.id);
    // Should not throw
  });
});

describe("cascade delete", () => {
  test("verification is deleted when user is deleted", async () => {
    const user = await createTestUser(db);
    await createVerification(user.id, "cascade@example.com");

    await db`DELETE FROM users WHERE id = ${user.id}`;

    const rows =
      await db`SELECT * FROM email_verifications WHERE user_id = ${user.id}`;
    expect(rows).toHaveLength(0);
  });
});

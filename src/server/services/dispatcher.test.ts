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

const mockEnqueueJob = mock(() =>
  Promise.resolve({ id: "test-id" } as import("./jobs").Job),
);
const mockHasPendingJob = mock(() => Promise.resolve(false));
mock.module("./jobs", () => ({
  enqueueJob: mockEnqueueJob,
  hasPendingJob: mockHasPendingJob,
  claimNextJob: mock(() => Promise.resolve(null)),
  completeJob: mock(() => Promise.resolve()),
  failJob: mock(() => Promise.resolve()),
  executeSyncStars: mock(() => Promise.resolve()),
  executeSendDigest: mock(() => Promise.resolve()),
}));

import { db } from "./database";

describe("dispatcher service", () => {
  let userId: string;

  beforeEach(async () => {
    await db`DELETE FROM consent_records`;
    await db`DELETE FROM jobs`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;

    mockEnqueueJob.mockClear();
    mockHasPendingJob.mockClear();
    mockHasPendingJob.mockImplementation(() => Promise.resolve(false));

    const currentDow =
      Number(
        (
          await db`SELECT EXTRACT(ISODOW FROM now() AT TIME ZONE 'UTC') AS dow`
        )[0].dow,
      ) - 1;
    const currentHour = Number(
      (await db`SELECT EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC') AS hour`)[0]
        .hour,
    );

    const users = await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token, digest_day, digest_hour, timezone, is_active, consented_to_emails)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'encrypted-token', ${currentDow}, ${currentHour}, 'UTC', true, true)
      RETURNING id
    `;
    userId = users[0].id as string;
  });

  afterEach(async () => {
    await db`DELETE FROM consent_records`;
    await db`DELETE FROM jobs`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("getUsersDueForDigest returns users matching current time in their timezone", async () => {
    const { getUsersDueForDigest } = await import("./dispatcher");

    const users = await getUsersDueForDigest();

    expect(users.length).toBe(1);
    expect(users[0].id).toBe(userId);
    expect(users[0].github_username).toBe("testuser");
  });

  test("getUsersDueForDigest excludes inactive users", async () => {
    await db`UPDATE users SET is_active = false WHERE id = ${userId}`;

    const { getUsersDueForDigest } = await import("./dispatcher");

    const users = await getUsersDueForDigest();

    expect(users.length).toBe(0);
  });

  test("getUsersDueForSync returns users whose digest is due in 30 minutes", async () => {
    const thirtyMinDow =
      Number(
        (
          await db`SELECT EXTRACT(ISODOW FROM (now() + interval '30 minutes') AT TIME ZONE 'UTC') AS dow`
        )[0].dow,
      ) - 1;
    const thirtyMinHour = Number(
      (
        await db`SELECT EXTRACT(HOUR FROM (now() + interval '30 minutes') AT TIME ZONE 'UTC') AS hour`
      )[0].hour,
    );

    await db`UPDATE users SET digest_day = ${thirtyMinDow}, digest_hour = ${thirtyMinHour} WHERE id = ${userId}`;

    const { getUsersDueForSync } = await import("./dispatcher");

    const users = await getUsersDueForSync();

    expect(users.length).toBe(1);
    expect(users[0].id).toBe(userId);
  });

  test("dispatchDigests enqueues send_digest for due users", async () => {
    const { dispatchDigests } = await import("./dispatcher");

    await dispatchDigests();

    expect(mockEnqueueJob).toHaveBeenCalledTimes(1);
    expect(mockEnqueueJob).toHaveBeenCalledWith("send_digest", userId);
  });

  test("dispatchDigests skips users with existing pending jobs", async () => {
    mockHasPendingJob.mockImplementation(() => Promise.resolve(true));

    const { dispatchDigests } = await import("./dispatcher");

    await dispatchDigests();

    expect(mockHasPendingJob).toHaveBeenCalledWith("send_digest", userId);
    expect(mockEnqueueJob).not.toHaveBeenCalled();
  });
});

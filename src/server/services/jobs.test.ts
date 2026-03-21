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
import type { Job } from "./jobs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("./database", () => ({
  get db() {
    return connection;
  },
}));

const mockSyncUserStars = mock(() => Promise.resolve());
mock.module("./stars", () => ({
  syncUserStars: mockSyncUserStars,
}));

const mockDecrypt = mock((stored: string) => `decrypted-${stored}`);
mock.module("./encryption", () => ({
  decrypt: mockDecrypt,
}));

const mockSelectReposForDigest = mock(
  (): Promise<import("./digest").SelectedRepo[]> => Promise.resolve([]),
);
const mockRecordDigestSelections = mock(() => Promise.resolve());
mock.module("./digest", () => ({
  selectReposForDigest: mockSelectReposForDigest,
  recordDigestSelections: mockRecordDigestSelections,
}));

const mockRenderDigestEmail = mock(() => ({
  subject: "Your weekly digest",
  html: "<h1>Digest</h1>",
  text: "Digest",
  headers: {
    "List-Unsubscribe": "<http://localhost:3000/unsubscribe?token=mock-token>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  },
}));
mock.module("./digest-email", () => ({
  renderDigestEmail: mockRenderDigestEmail,
}));

const mockEmailSend = mock(() => Promise.resolve());
const mockGetEmailService = mock(() => ({ send: mockEmailSend }));
mock.module("./email", () => ({
  getEmailService: mockGetEmailService,
}));

const mockGenerateUnsubscribeToken = mock(
  (userId: string) => `mock-unsub-token-${userId}`,
);
mock.module("./unsubscribe", () => ({
  generateUnsubscribeToken: mockGenerateUnsubscribeToken,
}));

import { db } from "./database";

function assertJob(job: Job | null): Job {
  if (!job) throw new Error("Expected job to be non-null");
  return job;
}

describe("jobs service", () => {
  let userId: string;

  beforeEach(async () => {
    await db`DELETE FROM jobs`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;

    const users = await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'encrypted-token')
      RETURNING id
    `;
    userId = users[0].id as string;
  });

  afterEach(async () => {
    await db`DELETE FROM jobs`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("enqueueJob creates a pending job with correct fields", async () => {
    const { enqueueJob } = await import("./jobs");

    const job = await enqueueJob("sync_stars", userId);

    expect(job.id).toBeDefined();
    expect(job.type).toBe("sync_stars");
    expect(job.user_id).toBe(userId);
    expect(job.status).toBe("pending");
    expect(job.attempts).toBe(0);
    expect(job.max_attempts).toBe(3);
    expect(job.run_at).toBeInstanceOf(Date);
    expect(job.started_at).toBeNull();
    expect(job.completed_at).toBeNull();
    expect(job.error).toBeNull();
    expect(job.created_at).toBeInstanceOf(Date);
  });

  test("enqueueJob accepts a future run_at", async () => {
    const { enqueueJob } = await import("./jobs");

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    const job = await enqueueJob("send_digest", userId, futureDate);

    expect(job.type).toBe("send_digest");
    expect(job.run_at.getTime()).toBeCloseTo(futureDate.getTime(), -3);
  });

  test("claimNextJob claims the oldest pending job", async () => {
    const { enqueueJob, claimNextJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);

    const claimed = assertJob(await claimNextJob());

    expect(claimed.status).toBe("running");
    expect(claimed.started_at).toBeInstanceOf(Date);
    expect(claimed.user_id).toBe(userId);
  });

  test("claimNextJob returns null when no jobs pending", async () => {
    const { claimNextJob } = await import("./jobs");

    const claimed = await claimNextJob();

    expect(claimed).toBeNull();
  });

  test("claimNextJob skips jobs with future run_at", async () => {
    const { enqueueJob, claimNextJob } = await import("./jobs");

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    await enqueueJob("sync_stars", userId, futureDate);

    const claimed = await claimNextJob();

    expect(claimed).toBeNull();
  });

  test("completeJob marks job as completed with completed_at", async () => {
    const { enqueueJob, claimNextJob, completeJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);
    const claimed = assertJob(await claimNextJob());

    await completeJob(claimed.id);

    const rows = await db`SELECT * FROM jobs WHERE id = ${claimed.id}`;
    expect(rows[0].status).toBe("completed");
    expect(rows[0].completed_at).toBeInstanceOf(Date);
  });

  test("failJob retries when under max_attempts", async () => {
    const { enqueueJob, claimNextJob, failJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);
    const claimed = assertJob(await claimNextJob());

    await failJob(claimed.id, "temporary error");

    const rows = await db`SELECT * FROM jobs WHERE id = ${claimed.id}`;
    expect(rows[0].status).toBe("pending");
    expect(Number(rows[0].attempts)).toBe(1);
    expect(rows[0].error).toBe("temporary error");
    // Backoff: run_at should be ~30s in the future (attempts * 30s)
    const runAt = new Date(rows[0].run_at as string);
    expect(runAt.getTime()).toBeGreaterThan(Date.now() + 20_000);
  });

  test("failJob marks as permanently failed when max_attempts reached", async () => {
    const { enqueueJob, claimNextJob, failJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);
    const claimed = assertJob(await claimNextJob());

    // Set attempts to max_attempts - 1 so next fail reaches the limit
    await db`UPDATE jobs SET attempts = ${claimed.max_attempts - 1} WHERE id = ${claimed.id}`;

    await failJob(claimed.id, "permanent error");

    const rows = await db`SELECT * FROM jobs WHERE id = ${claimed.id}`;
    expect(rows[0].status).toBe("failed");
    expect(Number(rows[0].attempts)).toBe(claimed.max_attempts);
    expect(rows[0].error).toBe("permanent error");
  });

  test("hasPendingJob returns true when matching pending job exists", async () => {
    const { enqueueJob, hasPendingJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);

    const result = await hasPendingJob("sync_stars", userId);

    expect(result).toBe(true);
  });

  test("hasPendingJob returns false when no matching job", async () => {
    const { hasPendingJob } = await import("./jobs");

    const result = await hasPendingJob("sync_stars", userId);

    expect(result).toBe(false);
  });

  test("executeSyncStars decrypts token and calls syncUserStars", async () => {
    const { enqueueJob, claimNextJob, executeSyncStars } = await import(
      "./jobs"
    );
    mockDecrypt.mockClear();
    mockSyncUserStars.mockClear();

    await enqueueJob("sync_stars", userId);
    const job = assertJob(await claimNextJob());

    await executeSyncStars(job);

    expect(mockDecrypt).toHaveBeenCalledTimes(1);
    expect(mockDecrypt).toHaveBeenCalledWith("encrypted-token");
    expect(mockSyncUserStars).toHaveBeenCalledTimes(1);
    expect(mockSyncUserStars).toHaveBeenCalledWith(
      userId,
      "decrypted-encrypted-token",
      "user",
    );
  });

  test("executeSendDigest selects repos, records, renders, and sends email", async () => {
    const { enqueueJob, claimNextJob, executeSendDigest } = await import(
      "./jobs"
    );

    process.env.FROM_EMAIL = "noreply@restarred.dev";
    process.env.FROM_NAME = "Restarred";

    const mockRepos = [
      {
        starId: "star-1",
        cycle: 1,
        repoId: 100,
        fullName: "owner/repo",
        description: "A repo",
        language: "TypeScript",
        stargazersCount: 42,
        htmlUrl: "https://github.com/owner/repo",
        starredAt: new Date(),
        lastActivityAt: new Date(),
        isArchived: false,
      },
    ];

    mockSelectReposForDigest.mockClear();
    mockRecordDigestSelections.mockClear();
    mockRenderDigestEmail.mockClear();
    mockEmailSend.mockClear();
    mockGenerateUnsubscribeToken.mockClear();
    mockGetEmailService.mockClear();

    mockSelectReposForDigest.mockImplementation(() =>
      Promise.resolve(mockRepos),
    );

    await enqueueJob("send_digest", userId);
    const job = assertJob(await claimNextJob());

    await executeSendDigest(job);

    expect(mockSelectReposForDigest).toHaveBeenCalledTimes(1);
    expect(mockSelectReposForDigest).toHaveBeenCalledWith({
      userId,
      excludeOwner: "testuser",
    });
    expect(mockRecordDigestSelections).toHaveBeenCalledTimes(1);
    expect(mockRecordDigestSelections).toHaveBeenCalledWith(userId, [
      { starId: "star-1", cycle: 1 },
    ]);
    expect(mockGenerateUnsubscribeToken).toHaveBeenCalledWith(userId);
    expect(mockRenderDigestEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith({
      to: { email: "test@example.com", name: "testuser" },
      from: { email: "noreply@restarred.dev", name: "Restarred" },
      subject: "Your weekly digest",
      html: "<h1>Digest</h1>",
      text: "Digest",
      headers: {
        "List-Unsubscribe":
          "<http://localhost:3000/unsubscribe?token=mock-token>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  });

  test("executeSendDigest skips email when no repos selected", async () => {
    const { enqueueJob, claimNextJob, executeSendDigest } = await import(
      "./jobs"
    );

    mockSelectReposForDigest.mockClear();
    mockRecordDigestSelections.mockClear();
    mockRenderDigestEmail.mockClear();
    mockEmailSend.mockClear();
    mockGetEmailService.mockClear();

    mockSelectReposForDigest.mockImplementation(() => Promise.resolve([]));

    await enqueueJob("send_digest", userId);
    const job = assertJob(await claimNextJob());

    await executeSendDigest(job);

    expect(mockSelectReposForDigest).toHaveBeenCalledTimes(1);
    expect(mockRecordDigestSelections).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});

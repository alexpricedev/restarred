# Job Queue Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Background job system that syncs stars at :30 and sends digest emails on the hour, driven by a PostgreSQL-backed job table with in-process polling.

**Architecture:** A `jobs` table stores pending/running/completed/failed jobs. A dispatcher service checks every minute for users due a digest (timezone-aware), enqueues `sync_stars` and `send_digest` jobs. A worker loop polls every 1 second, claims jobs atomically with `FOR UPDATE SKIP LOCKED`, and executes them sequentially.

**Tech Stack:** Bun, PostgreSQL (Bun.SQL tagged templates), existing services (stars, digest, digest-email, email, encryption).

---

### Task 1: Create jobs table migration

**Files:**
- Create: `src/server/database/migrations/008_create_jobs.ts`

**Step 1: Write the migration**

```ts
import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    CREATE TABLE jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL CHECK (type IN ('sync_stars', 'send_digest')),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`CREATE INDEX idx_jobs_claim ON jobs(status, run_at) WHERE status = 'pending'`;
  await db`CREATE INDEX idx_jobs_user_type ON jobs(user_id, type, status)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS jobs`;
};
```

**Step 2: Run migration**

Run: `NODE_ENV=test bun run src/server/database/cli.ts up`
Expected: Migration 008 applies successfully.

**Step 3: Commit**

```bash
git add src/server/database/migrations/008_create_jobs.ts
git commit -m "feat: add jobs table migration"
```

---

### Task 2: Job service — core CRUD functions

**Files:**
- Create: `src/server/services/jobs.ts`
- Test: `src/server/services/jobs.test.ts`

**Step 1: Write failing tests for enqueueJob, claimNextJob, completeJob, failJob**

```ts
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

describe("jobs service", () => {
  let userId: string;

  beforeEach(async () => {
    await db`DELETE FROM jobs`;
    await db`DELETE FROM digest_history`;
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
    await db`DELETE FROM digest_history`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("enqueueJob creates a pending job", async () => {
    const { enqueueJob } = await import("./jobs");

    const job = await enqueueJob("sync_stars", userId);

    expect(job.type).toBe("sync_stars");
    expect(job.user_id).toBe(userId);
    expect(job.status).toBe("pending");
    expect(job.attempts).toBe(0);
    expect(job.max_attempts).toBe(3);
  });

  test("enqueueJob accepts a future run_at", async () => {
    const { enqueueJob } = await import("./jobs");

    const future = new Date(Date.now() + 60_000);
    const job = await enqueueJob("send_digest", userId, future);

    expect(job.run_at.getTime()).toBeCloseTo(future.getTime(), -3);
  });

  test("claimNextJob claims the oldest pending job", async () => {
    const { enqueueJob, claimNextJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);

    const claimed = await claimNextJob();

    expect(claimed).not.toBeNull();
    expect(claimed!.status).toBe("running");
    expect(claimed!.started_at).not.toBeNull();
  });

  test("claimNextJob returns null when no jobs are pending", async () => {
    const { claimNextJob } = await import("./jobs");

    const claimed = await claimNextJob();
    expect(claimed).toBeNull();
  });

  test("claimNextJob skips jobs with future run_at", async () => {
    const { enqueueJob, claimNextJob } = await import("./jobs");

    const future = new Date(Date.now() + 60_000);
    await enqueueJob("sync_stars", userId, future);

    const claimed = await claimNextJob();
    expect(claimed).toBeNull();
  });

  test("completeJob marks job as completed", async () => {
    const { enqueueJob, claimNextJob, completeJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);
    const claimed = await claimNextJob();

    await completeJob(claimed!.id);

    const rows = await db`SELECT * FROM jobs WHERE id = ${claimed!.id}`;
    expect(rows[0].status).toBe("completed");
    expect(rows[0].completed_at).not.toBeNull();
  });

  test("failJob retries when under max_attempts", async () => {
    const { enqueueJob, claimNextJob, failJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);
    const claimed = await claimNextJob();

    await failJob(claimed!.id, "API timeout");

    const rows = await db`SELECT * FROM jobs WHERE id = ${claimed!.id}`;
    expect(rows[0].status).toBe("pending");
    expect(Number(rows[0].attempts)).toBe(1);
    expect(rows[0].error).toBe("API timeout");
    expect(rows[0].run_at.getTime()).toBeGreaterThan(Date.now());
  });

  test("failJob marks failed when max_attempts reached", async () => {
    const { enqueueJob, claimNextJob, failJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);

    for (let i = 0; i < 3; i++) {
      const claimed = await claimNextJob();
      if (!claimed) break;
      await failJob(claimed.id, `Attempt ${i + 1} failed`);
    }

    const rows = await db`SELECT * FROM jobs WHERE user_id = ${userId}`;
    expect(rows[0].status).toBe("failed");
    expect(Number(rows[0].attempts)).toBe(3);
  });

  test("hasPendingJob returns true when matching job exists", async () => {
    const { enqueueJob, hasPendingJob } = await import("./jobs");

    await enqueueJob("sync_stars", userId);

    const result = await hasPendingJob("sync_stars", userId);
    expect(result).toBe(true);
  });

  test("hasPendingJob returns false when no matching job exists", async () => {
    const { hasPendingJob } = await import("./jobs");

    const result = await hasPendingJob("sync_stars", userId);
    expect(result).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `NODE_ENV=test bun test src/server/services/jobs.test.ts`
Expected: FAIL — `./jobs` module not found.

**Step 3: Write the implementation**

```ts
import { db } from "./database";
import { log } from "./logger";

export interface Job {
  id: string;
  type: "sync_stars" | "send_digest";
  user_id: string;
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  max_attempts: number;
  run_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  error: string | null;
  created_at: Date;
}

export const enqueueJob = async (
  type: Job["type"],
  userId: string,
  runAt?: Date,
): Promise<Job> => {
  const rows = await db`
    INSERT INTO jobs (type, user_id, run_at)
    VALUES (${type}, ${userId}, ${runAt ?? new Date()})
    RETURNING *
  `;
  log.info("jobs", `Enqueued ${type} for user ${userId}`);
  return rows[0] as Job;
};

export const claimNextJob = async (): Promise<Job | null> => {
  const rows = await db`
    UPDATE jobs SET
      status = 'running',
      started_at = now()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending' AND run_at <= now()
      ORDER BY run_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;
  return rows.length > 0 ? (rows[0] as Job) : null;
};

export const completeJob = async (jobId: string): Promise<void> => {
  await db`
    UPDATE jobs SET
      status = 'completed',
      completed_at = now()
    WHERE id = ${jobId}
  `;
};

export const failJob = async (
  jobId: string,
  error: string,
): Promise<void> => {
  const rows = await db`
    UPDATE jobs SET
      attempts = attempts + 1,
      error = ${error}
    WHERE id = ${jobId}
    RETURNING attempts, max_attempts
  `;
  const { attempts, max_attempts } = rows[0] as {
    attempts: number;
    max_attempts: number;
  };

  if (attempts >= max_attempts) {
    await db`UPDATE jobs SET status = 'failed' WHERE id = ${jobId}`;
    log.error("jobs", `Job ${jobId} failed permanently: ${error}`);
  } else {
    const backoffSeconds = attempts * 30;
    await db`
      UPDATE jobs SET
        status = 'pending',
        run_at = now() + ${`${backoffSeconds} seconds`}::interval
      WHERE id = ${jobId}
    `;
    log.warn("jobs", `Job ${jobId} failed (attempt ${attempts}/${max_attempts}), retrying in ${backoffSeconds}s`);
  }
};

export const hasPendingJob = async (
  type: Job["type"],
  userId: string,
): Promise<boolean> => {
  const rows = await db`
    SELECT 1 FROM jobs
    WHERE type = ${type}
      AND user_id = ${userId}
      AND status IN ('pending', 'running')
      AND created_at >= now() - interval '24 hours'
    LIMIT 1
  `;
  return rows.length > 0;
};
```

**Step 4: Run tests to verify they pass**

Run: `NODE_ENV=test bun test src/server/services/jobs.test.ts`
Expected: All 8 tests pass.

**Step 5: Run lint and typecheck**

Run: `bun run check`

**Step 6: Commit**

```bash
git add src/server/services/jobs.ts src/server/services/jobs.test.ts
git commit -m "feat: add job service with enqueue, claim, complete, fail"
```

---

### Task 3: Job executors — executeSyncStars and executeSendDigest

**Files:**
- Modify: `src/server/services/jobs.ts` (add executor functions)
- Test: `src/server/services/jobs.test.ts` (add executor tests)

**Step 1: Add failing tests for executors**

Add to the existing test file, inside the describe block. These tests mock the downstream services (`stars`, `digest`, `digest-email`, `email`, `encryption`, `users`).

Mock setup — add these mocks at the top of the test file, after the database mock:

```ts
const mockSyncUserStars = mock<(userId: string, token: string) => Promise<void>>();
mock.module("./stars", () => ({
  syncUserStars: mockSyncUserStars,
}));

const mockDecrypt = mock<(stored: string) => string>();
mock.module("./encryption", () => ({
  decrypt: mockDecrypt,
}));

const mockSelectReposForDigest = mock<(opts: { userId: string; excludeOwner?: string }) => Promise<Array<{ starId: string; cycle: number }>>>();
const mockRecordDigestSelections = mock<(userId: string, selections: Array<{ starId: string; cycle: number }>) => Promise<void>>();
mock.module("./digest", () => ({
  selectReposForDigest: mockSelectReposForDigest,
  recordDigestSelections: mockRecordDigestSelections,
}));

const mockRenderDigestEmail = mock<(user: unknown, repos: unknown, token: string) => { subject: string; html: string; text: string }>();
mock.module("./digest-email", () => ({
  renderDigestEmail: mockRenderDigestEmail,
}));

const mockEmailSend = mock<(msg: unknown) => Promise<void>>();
mock.module("./email", () => ({
  getEmailService: () => ({ send: mockEmailSend }),
}));
```

Add tests:

```ts
test("executeSyncStars decrypts token and calls syncUserStars", async () => {
  const { enqueueJob, claimNextJob, executeSyncStars } = await import("./jobs");

  await enqueueJob("sync_stars", userId);
  const job = await claimNextJob();

  mockDecrypt.mockReturnValueOnce("decrypted-github-token");
  mockSyncUserStars.mockResolvedValueOnce(undefined);

  await executeSyncStars(job!);

  expect(mockDecrypt).toHaveBeenCalledWith("encrypted-token");
  expect(mockSyncUserStars).toHaveBeenCalledWith(userId, "decrypted-github-token");
});

test("executeSendDigest selects repos, records, renders, and sends email", async () => {
  const { enqueueJob, claimNextJob, executeSendDigest } = await import("./jobs");

  await enqueueJob("send_digest", userId);
  const job = await claimNextJob();

  const fakeRepos = [{ starId: "s1", cycle: 1, fullName: "owner/repo" }];
  mockSelectReposForDigest.mockResolvedValueOnce(fakeRepos as never);
  mockRecordDigestSelections.mockResolvedValueOnce(undefined);
  mockRenderDigestEmail.mockReturnValueOnce({
    subject: "re:starred — test",
    html: "<p>test</p>",
    text: "test",
  });
  mockEmailSend.mockResolvedValueOnce(undefined);

  await executeSendDigest(job!);

  expect(mockSelectReposForDigest).toHaveBeenCalled();
  expect(mockRecordDigestSelections).toHaveBeenCalled();
  expect(mockRenderDigestEmail).toHaveBeenCalled();
  expect(mockEmailSend).toHaveBeenCalled();
});

test("executeSendDigest skips email when no repos selected", async () => {
  const { enqueueJob, claimNextJob, executeSendDigest } = await import("./jobs");

  await enqueueJob("send_digest", userId);
  const job = await claimNextJob();

  mockSelectReposForDigest.mockResolvedValueOnce([]);

  await executeSendDigest(job!);

  expect(mockRecordDigestSelections).not.toHaveBeenCalled();
  expect(mockEmailSend).not.toHaveBeenCalled();
});
```

Also add a `beforeEach` block that resets all mocks:

```ts
mockSyncUserStars.mockReset();
mockDecrypt.mockReset();
mockSelectReposForDigest.mockReset();
mockRecordDigestSelections.mockReset();
mockRenderDigestEmail.mockReset();
mockEmailSend.mockReset();
```

**Step 2: Run tests to verify they fail**

Run: `NODE_ENV=test bun test src/server/services/jobs.test.ts`
Expected: FAIL — `executeSyncStars` and `executeSendDigest` not found.

**Step 3: Implement executors in jobs.ts**

Add imports at top:

```ts
import { decrypt } from "./encryption";
import { syncUserStars } from "./stars";
import { selectReposForDigest, recordDigestSelections } from "./digest";
import { renderDigestEmail } from "./digest-email";
import { getEmailService } from "./email";
import { computeHMAC } from "../utils/crypto";
```

Add executor functions:

```ts
export const executeSyncStars = async (job: Job): Promise<void> => {
  const rows = await db`SELECT github_token FROM users WHERE id = ${job.user_id}`;
  if (rows.length === 0) throw new Error(`User ${job.user_id} not found`);

  const token = decrypt(rows[0].github_token as string);
  await syncUserStars(job.user_id, token);
  log.info("jobs", `Synced stars for user ${job.user_id}`);
};

export const executeSendDigest = async (job: Job): Promise<void> => {
  const userRows = await db`SELECT * FROM users WHERE id = ${job.user_id}`;
  if (userRows.length === 0) throw new Error(`User ${job.user_id} not found`);
  const user = userRows[0] as import("./auth").User;

  const excludeOwner = user.filter_own_repos ? user.github_username : undefined;
  const repos = await selectReposForDigest({ userId: job.user_id, excludeOwner });

  if (repos.length === 0) {
    log.warn("jobs", `No repos to send for user ${job.user_id}, skipping digest`);
    return;
  }

  await recordDigestSelections(
    job.user_id,
    repos.map((r) => ({ starId: r.starId, cycle: r.cycle })),
  );

  const unsubscribeToken = `${job.user_id}:${computeHMAC(job.user_id)}`;
  const { subject, html, text } = renderDigestEmail(user, repos, unsubscribeToken);

  const email = getEmailService();
  const toAddress = user.email_override || user.github_email;
  await email.send({
    to: { email: toAddress, name: user.github_username },
    from: {
      email: process.env.FROM_EMAIL as string,
      name: process.env.FROM_NAME as string,
    },
    subject,
    html,
    text,
  });

  log.info("jobs", `Sent digest to ${toAddress} for user ${job.user_id}`);
};
```

**Step 4: Run tests to verify they pass**

Run: `NODE_ENV=test bun test src/server/services/jobs.test.ts`
Expected: All 11 tests pass.

**Step 5: Run lint and typecheck**

Run: `bun run check`

**Step 6: Commit**

```bash
git add src/server/services/jobs.ts src/server/services/jobs.test.ts
git commit -m "feat: add job executors for sync_stars and send_digest"
```

---

### Task 4: Dispatcher service — scheduling and worker loop

**Files:**
- Create: `src/server/services/dispatcher.ts`
- Test: `src/server/services/dispatcher.test.ts`

**Step 1: Write failing tests**

The dispatcher has two testable units: `getUsersDueForDigest` (pure-ish query) and `getUsersDueForSync` (same but 30 min ahead). The `startDispatcher`/`stopDispatcher` are integration-level — test the scheduling logic, not the timers.

```ts
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

const mockEnqueueJob = mock<(type: string, userId: string, runAt?: Date) => Promise<unknown>>();
const mockHasPendingJob = mock<(type: string, userId: string) => Promise<boolean>>();
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
    await db`DELETE FROM jobs`;
    await db`DELETE FROM digest_history`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;

    mockEnqueueJob.mockReset();
    mockHasPendingJob.mockReset();
    mockHasPendingJob.mockResolvedValue(false);
  });

  afterEach(async () => {
    await db`DELETE FROM jobs`;
    await db`DELETE FROM digest_history`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("getUsersDueForDigest returns users whose digest_day and digest_hour match now in their timezone", async () => {
    const { getUsersDueForDigest } = await import("./dispatcher");

    const now = new Date();
    const userTz = "UTC";
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();

    const users = await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token, digest_day, digest_hour, timezone, is_active)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'token', ${dayOfWeek}, ${hour}, ${userTz}, true)
      RETURNING id
    `;
    userId = users[0].id as string;

    const due = await getUsersDueForDigest();
    expect(due.length).toBeGreaterThanOrEqual(1);
    expect(due.some((u: { id: string }) => u.id === userId)).toBe(true);
  });

  test("getUsersDueForDigest excludes inactive users", async () => {
    const { getUsersDueForDigest } = await import("./dispatcher");

    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();

    const users = await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token, digest_day, digest_hour, timezone, is_active)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'token', ${dayOfWeek}, ${hour}, 'UTC', false)
      RETURNING id
    `;
    userId = users[0].id as string;

    const due = await getUsersDueForDigest();
    expect(due.some((u: { id: string }) => u.id === userId)).toBe(false);
  });

  test("getUsersDueForSync returns users whose digest is due in the next hour", async () => {
    const { getUsersDueForSync } = await import("./dispatcher");

    const nextHour = new Date(Date.now() + 30 * 60_000);
    const dayOfWeek = nextHour.getUTCDay();
    const hour = nextHour.getUTCHours();

    const users = await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token, digest_day, digest_hour, timezone, is_active)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'token', ${dayOfWeek}, ${hour}, 'UTC', true)
      RETURNING id
    `;
    userId = users[0].id as string;

    const due = await getUsersDueForSync();
    expect(due.length).toBeGreaterThanOrEqual(1);
    expect(due.some((u: { id: string }) => u.id === userId)).toBe(true);
  });

  test("dispatchDigests skips users with existing pending jobs", async () => {
    const { dispatchDigests } = await import("./dispatcher");

    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();

    await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token, digest_day, digest_hour, timezone, is_active)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'token', ${dayOfWeek}, ${hour}, 'UTC', true)
    `;

    mockHasPendingJob.mockResolvedValue(true);

    await dispatchDigests();

    expect(mockEnqueueJob).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `NODE_ENV=test bun test src/server/services/dispatcher.test.ts`
Expected: FAIL — `./dispatcher` module not found.

**Step 3: Implement the dispatcher**

```ts
import type { User } from "./auth";
import { db } from "./database";
import {
  type Job,
  claimNextJob,
  completeJob,
  enqueueJob,
  executeSendDigest,
  executeSyncStars,
  failJob,
  hasPendingJob,
} from "./jobs";
import { log } from "./logger";

export const getUsersDueForDigest = async (): Promise<User[]> => {
  const rows = await db`
    SELECT * FROM users
    WHERE is_active = true
      AND EXTRACT(DOW FROM now() AT TIME ZONE timezone) = digest_day
      AND EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = digest_hour
  `;
  return rows as User[];
};

export const getUsersDueForSync = async (): Promise<User[]> => {
  const rows = await db`
    SELECT * FROM users
    WHERE is_active = true
      AND EXTRACT(DOW FROM (now() + interval '30 minutes') AT TIME ZONE timezone) = digest_day
      AND EXTRACT(HOUR FROM (now() + interval '30 minutes') AT TIME ZONE timezone) = digest_hour
  `;
  return rows as User[];
};

export const dispatchSyncs = async (): Promise<void> => {
  const users = await getUsersDueForSync();
  for (const user of users) {
    const pending = await hasPendingJob("sync_stars", user.id);
    if (!pending) {
      await enqueueJob("sync_stars", user.id);
    }
  }
  if (users.length > 0) {
    log.info("dispatcher", `Enqueued sync_stars for ${users.length} user(s)`);
  }
};

export const dispatchDigests = async (): Promise<void> => {
  const users = await getUsersDueForDigest();
  for (const user of users) {
    const pending = await hasPendingJob("send_digest", user.id);
    if (!pending) {
      await enqueueJob("send_digest", user.id);
    }
  }
  if (users.length > 0) {
    log.info("dispatcher", `Enqueued send_digest for ${users.length} user(s)`);
  }
};

const executeJob = async (job: Job): Promise<void> => {
  switch (job.type) {
    case "sync_stars":
      await executeSyncStars(job);
      break;
    case "send_digest":
      await executeSendDigest(job);
      break;
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
};

const processNextJob = async (): Promise<void> => {
  const job = await claimNextJob();
  if (!job) return;

  log.info("jobs", `Processing ${job.type} job ${job.id} for user ${job.user_id}`);
  try {
    await executeJob(job);
    await completeJob(job.id);
    log.info("jobs", `Completed ${job.type} job ${job.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failJob(job.id, message);
  }
};

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let workerInterval: ReturnType<typeof setInterval> | null = null;

export const startDispatcher = (): (() => void) => {
  log.info("dispatcher", "Starting dispatcher and worker loop");

  schedulerInterval = setInterval(async () => {
    try {
      const minute = new Date().getMinutes();
      if (minute === 30) {
        await dispatchSyncs();
      }
      if (minute === 0) {
        await dispatchDigests();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("dispatcher", `Scheduler error: ${message}`);
    }
  }, 60_000);

  workerInterval = setInterval(async () => {
    try {
      await processNextJob();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("dispatcher", `Worker error: ${message}`);
    }
  }, 1_000);

  return () => {
    if (schedulerInterval) clearInterval(schedulerInterval);
    if (workerInterval) clearInterval(workerInterval);
    schedulerInterval = null;
    workerInterval = null;
    log.info("dispatcher", "Dispatcher stopped");
  };
};
```

**Step 4: Run tests to verify they pass**

Run: `NODE_ENV=test bun test src/server/services/dispatcher.test.ts`
Expected: All 4 tests pass.

**Step 5: Run lint and typecheck**

Run: `bun run check`

**Step 6: Commit**

```bash
git add src/server/services/dispatcher.ts src/server/services/dispatcher.test.ts
git commit -m "feat: add dispatcher service with scheduling and worker loop"
```

---

### Task 5: Integrate dispatcher into server startup

**Files:**
- Modify: `src/server/main.ts`

**Step 1: Add dispatcher import and start call**

After the existing `Bun.serve()` block and log line, add:

```ts
import { startDispatcher } from "./services/dispatcher";
```

At the top with other imports. Then after `log.info("server", ...)`:

```ts
startDispatcher();
```

**Step 2: Run lint and typecheck**

Run: `bun run check`

**Step 3: Commit**

```bash
git add src/server/main.ts
git commit -m "feat: start job dispatcher on server boot"
```

---

### Task 6: Add jobs test to package.json test script

**Files:**
- Modify: `package.json`

**Step 1: Update the test script**

The `test:services` script already runs `bun test src/server/services`, which will pick up `jobs.test.ts` and `dispatcher.test.ts` automatically. Verify this by running the full test suite.

**Step 2: Run full test suite**

Run: `bun run test`
Expected: All existing tests pass + new jobs and dispatcher tests pass.

**Step 3: Commit (only if package.json needed changes)**

If no changes needed, skip this commit.

---

### Task 7: Final verification

**Step 1: Run full lint + typecheck + test suite**

Run: `bun run check && bun run test`
Expected: Zero warnings, zero type errors, all tests pass.

**Step 2: Verify the dev server starts without errors**

The dev server is running in another tab. Check the terminal output for any dispatcher startup log lines — should see:
```
[INFO] [dispatcher] Starting dispatcher and worker loop
```

No errors.

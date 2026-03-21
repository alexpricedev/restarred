# Job Queue Design

Background job system for scheduled star syncing and digest delivery.

## Approach

PostgreSQL-backed job table with in-process polling. No external queue dependency. The Bun server runs a worker loop that claims and executes jobs, and a dispatcher that enqueues jobs on schedule.

## Database Schema

New migration adds a `jobs` table:

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, `gen_random_uuid()` |
| type | TEXT | `'sync_stars'` or `'send_digest'` |
| user_id | UUID | FK → users, ON DELETE CASCADE |
| status | TEXT | `'pending'` / `'running'` / `'completed'` / `'failed'` |
| attempts | INTEGER | Default 0 |
| max_attempts | INTEGER | Default 3 |
| run_at | TIMESTAMPTZ | When the job becomes eligible for execution |
| started_at | TIMESTAMPTZ | Nullable |
| completed_at | TIMESTAMPTZ | Nullable |
| error | TEXT | Nullable, last error message |
| created_at | TIMESTAMPTZ | Default now() |

Constraints:
- `CHECK (status IN ('pending', 'running', 'completed', 'failed'))`
- `CHECK (type IN ('sync_stars', 'send_digest'))`
- Index on `(status, run_at)` for the claim query

## Service Layer

### `src/server/services/jobs.ts`

Core job management functions:

- **`enqueueJob(type, userId, runAt?)`** — inserts a pending job. Defaults `run_at` to now.
- **`claimNextJob()`** — atomic claim: `UPDATE jobs SET status = 'running', started_at = now() WHERE status = 'pending' AND run_at <= now() ORDER BY run_at LIMIT 1 RETURNING *`. Uses `FOR UPDATE SKIP LOCKED` for safe concurrent access.
- **`completeJob(jobId)`** — sets status to `'completed'`, `completed_at = now()`.
- **`failJob(jobId, error)`** — increments attempts. If `attempts >= max_attempts`, marks `'failed'`. Otherwise resets to `'pending'` with `run_at = now() + (attempts * 30 seconds)` for backoff.

### Job Executors

Two executor functions, selected by job type:

- **`executeSyncStars(job)`** — decrypts the user's GitHub token via `decrypt()`, calls `syncUserStars(userId, token)`.
- **`executeSendDigest(job)`** — loads user, calls `selectReposForDigest()`, `recordDigestSelections()`, `renderDigestEmail()`, and `emailService.send()`.

## Dispatcher

### `src/server/services/dispatcher.ts`

Two responsibilities: scheduling jobs and processing them.

**Scheduling** — checks every minute:

- At **:30 past the hour**: find active users whose digest is due at the *next* :00 (based on `digest_day`, `digest_hour`, and `timezone`). Enqueue `sync_stars` for each, with `run_at = now()`. This gives stars 30 minutes to sync before the digest is assembled.
- At **:00 on the hour**: find active users whose digest is due *now*. Enqueue `send_digest` for each, with `run_at = now()`.

Before enqueuing, check that no pending/running job of the same type already exists for that user today. This prevents duplicates if the dispatcher fires twice.

**Timezone matching**: convert current UTC time to each user's IANA timezone, then compare `digest_day` (day of week) and `digest_hour` (hour of day).

**Worker loop** — polls every 1 second:

- Calls `claimNextJob()`.
- If a job is claimed, executes it (sync_stars or send_digest).
- Processes one job at a time, sequentially.
- Logs job start, completion, and failure.

### Server Integration

In `main.ts`, after `Bun.serve()`:

```ts
import { startDispatcher } from "./services/dispatcher";
startDispatcher();
```

`startDispatcher()` sets up both the minute-interval scheduler and the 1-second worker loop. Returns a cleanup function that clears both intervals (for graceful shutdown / testing).

## Key Decisions

- **Sync at :30, digest at :00** — stars are always fresh when the digest runs. No overlap risk, no artificial delays between job types.
- **No duplicate jobs** — dispatcher checks for existing pending/running jobs before enqueuing.
- **Linear backoff** — failed jobs retry at 30s, 60s, 90s. Simple, predictable.
- **3 max attempts** — after 3 failures, job stays as `'failed'` for visibility. Post-MVP adds monitoring/alerting for these.
- **FOR UPDATE SKIP LOCKED** — safe for future multi-worker scaling without code changes.
- **1-second polling** — the claim query is a cheap indexed lookup. Jobs execute near-instantly after becoming eligible.
- **In-process** — worker runs inside the Bun server process. No separate process to deploy. Acceptable for MVP scale.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/server/database/migrations/NNN_create_jobs.ts` | New migration |
| `src/server/services/jobs.ts` | New service — enqueue, claim, complete, fail, executors |
| `src/server/services/jobs.test.ts` | New tests — job lifecycle, executors with mocked deps |
| `src/server/services/dispatcher.ts` | New service — scheduling logic, worker loop |
| `src/server/services/dispatcher.test.ts` | New tests — timezone matching, duplicate prevention |
| `src/server/main.ts` | Add `startDispatcher()` call after server starts |

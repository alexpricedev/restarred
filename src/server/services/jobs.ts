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

export async function enqueueJob(
  type: Job["type"],
  userId: string,
  runAt?: Date,
): Promise<Job> {
  const rows = runAt
    ? await db`
        INSERT INTO jobs (type, user_id, run_at)
        VALUES (${type}, ${userId}, ${runAt})
        RETURNING *
      `
    : await db`
        INSERT INTO jobs (type, user_id)
        VALUES (${type}, ${userId})
        RETURNING *
      `;

  const job = rows[0] as Job;
  log.info("jobs", `enqueued ${type} job ${job.id} for user ${userId}`);
  return job;
}

export async function claimNextJob(): Promise<Job | null> {
  const rows = await db`
    UPDATE jobs
    SET status = 'running', started_at = now()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending' AND run_at <= now()
      ORDER BY run_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;

  if (rows.length === 0) {
    return null;
  }

  const job = rows[0] as Job;
  log.info("jobs", `claimed job ${job.id} (${job.type})`);
  return job;
}

export async function completeJob(jobId: string): Promise<void> {
  await db`
    UPDATE jobs
    SET status = 'completed', completed_at = now()
    WHERE id = ${jobId}
  `;
  log.info("jobs", `completed job ${jobId}`);
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const rows = await db`
    UPDATE jobs
    SET attempts = attempts + 1, error = ${error}
    WHERE id = ${jobId}
    RETURNING attempts, max_attempts
  `;

  const { attempts, max_attempts: maxAttempts } = rows[0] as {
    attempts: number;
    max_attempts: number;
  };

  if (attempts >= maxAttempts) {
    await db`
      UPDATE jobs
      SET status = 'failed'
      WHERE id = ${jobId}
    `;
    log.warn(
      "jobs",
      `job ${jobId} permanently failed after ${attempts} attempts: ${error}`,
    );
  } else {
    const backoffSeconds = attempts * 30;
    await db`
      UPDATE jobs
      SET status = 'pending', run_at = now() + ${`${backoffSeconds} seconds`}::interval
      WHERE id = ${jobId}
    `;
    log.info(
      "jobs",
      `job ${jobId} will retry in ${backoffSeconds}s (attempt ${attempts}/${maxAttempts})`,
    );
  }
}

export async function hasPendingJob(
  type: Job["type"],
  userId: string,
): Promise<boolean> {
  const rows = await db`
    SELECT 1 FROM jobs
    WHERE type = ${type}
      AND user_id = ${userId}
      AND status IN ('pending', 'running')
      AND created_at >= now() - interval '24 hours'
    LIMIT 1
  `;
  return rows.length > 0;
}

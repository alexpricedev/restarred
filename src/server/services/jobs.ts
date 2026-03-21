import { computeHMAC } from "../utils/crypto";
import type { User } from "./auth";
import { db } from "./database";
import { recordDigestSelections, selectReposForDigest } from "./digest";
import { renderDigestEmail } from "./digest-email";
import { getEmailService } from "./email";
import { decrypt } from "./encryption";
import { log } from "./logger";
import { syncUserStars } from "./stars";

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
  const rows = await db`
    UPDATE jobs
    SET status = 'completed', completed_at = now()
    WHERE id = ${jobId} AND status = 'running'
    RETURNING id
  `;
  if (rows.length === 0) {
    log.warn(
      "jobs",
      `completeJob called for unknown or non-running job ${jobId}`,
    );
    return;
  }
  log.info("jobs", `completed job ${jobId}`);
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const rows = await db`
    UPDATE jobs
    SET attempts = attempts + 1, error = ${error}
    WHERE id = ${jobId}
    RETURNING attempts, max_attempts
  `;

  if (rows.length === 0) {
    log.warn("jobs", `failJob called for unknown job ${jobId}`);
    return;
  }

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

export async function executeSyncStars(job: Job): Promise<void> {
  const rows = await db`
    SELECT github_token FROM users WHERE id = ${job.user_id}
  `;

  if (rows.length === 0) {
    throw new Error(`User ${job.user_id} not found`);
  }

  const encryptedToken = rows[0].github_token as string;
  const decryptedToken = decrypt(encryptedToken);
  await syncUserStars(job.user_id, decryptedToken);
  log.info("jobs", `sync_stars completed for user ${job.user_id}`);
}

export async function executeSendDigest(job: Job): Promise<void> {
  const rows = await db`
    SELECT * FROM users WHERE id = ${job.user_id}
  `;

  if (rows.length === 0) {
    throw new Error(`User ${job.user_id} not found`);
  }

  const user = rows[0] as User;

  const excludeOwner = user.filter_own_repos ? user.github_username : undefined;

  const repos = await selectReposForDigest({
    userId: job.user_id,
    excludeOwner,
  });

  if (repos.length === 0) {
    log.warn(
      "jobs",
      `no repos selected for digest, skipping email for user ${job.user_id}`,
    );
    return;
  }

  await recordDigestSelections(
    job.user_id,
    repos.map((r) => ({ starId: r.starId, cycle: r.cycle })),
  );

  const unsubscribeToken = `${job.user_id}:${computeHMAC(job.user_id)}`;
  const { subject, html, text } = renderDigestEmail(
    user,
    repos,
    unsubscribeToken,
  );

  const emailService = getEmailService();
  await emailService.send({
    to: {
      email: user.email_override || user.github_email,
      name: user.github_username,
    },
    from: {
      email: process.env.FROM_EMAIL as string,
      name: process.env.FROM_NAME as string,
    },
    subject,
    html,
    text,
  });

  log.info("jobs", `send_digest completed for user ${job.user_id}`);
}

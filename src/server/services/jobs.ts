import type { User } from "./auth";
import { db } from "./database";
import { recordDigestSelections, selectReposForDigest } from "./digest";
import { renderDigestEmail } from "./digest-email";
import { getEmailService } from "./email";
import { decrypt } from "./encryption";
import { trackEvent } from "./events";
import { log } from "./logger";
import { syncUserStars } from "./stars";
import { generateUnsubscribeToken } from "./unsubscribe";

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
    SET
      attempts = attempts + 1,
      error = ${error},
      status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
      run_at = CASE WHEN attempts + 1 >= max_attempts THEN run_at ELSE now() + ((attempts + 1) * 30 || ' seconds')::interval END
    WHERE id = ${jobId} AND status = 'running'
    RETURNING attempts, max_attempts, status
  `;

  if (rows.length === 0) {
    log.warn("jobs", `failJob called for unknown or non-running job ${jobId}`);
    return;
  }

  const {
    attempts,
    max_attempts: maxAttempts,
    status,
  } = rows[0] as {
    attempts: number;
    max_attempts: number;
    status: string;
  };

  if (status === "failed") {
    log.warn(
      "jobs",
      `job ${jobId} permanently failed after ${attempts} attempts: ${error}`,
    );
  } else {
    const backoffSeconds = attempts * 30;
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
    SELECT github_token, role FROM users WHERE id = ${job.user_id}
  `;

  if (rows.length === 0) {
    throw new Error(`User ${job.user_id} not found`);
  }

  const encryptedToken = rows[0].github_token as string;
  const role = rows[0].role as "user" | "admin";
  const decryptedToken = decrypt(encryptedToken);
  await syncUserStars(job.user_id, decryptedToken, role);
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

  const unsubscribeToken = generateUnsubscribeToken(job.user_id);
  const email = renderDigestEmail(user, repos, unsubscribeToken);

  const emailService = getEmailService();
  await emailService.send({
    to: {
      email: user.email_override || user.github_email,
      name: user.github_name || user.github_username,
    },
    from: {
      email: process.env.FROM_EMAIL as string,
      name: process.env.FROM_NAME as string,
    },
    subject: email.subject,
    html: email.html,
    text: email.text,
    headers: email.headers,
  });

  trackEvent("digest_sent", { role: user.role }).catch((err) => {
    log.warn("events", `Failed to track digest_sent: ${err}`);
  });

  log.info("jobs", `send_digest completed for user ${job.user_id}`);
}

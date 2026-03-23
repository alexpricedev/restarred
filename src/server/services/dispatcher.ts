import type { User } from "./auth";
import { db } from "./database";
import { trackEvent } from "./events";
import {
  claimNextJob,
  completeJob,
  enqueueJob,
  executeSendDigest,
  executeSyncStars,
  failJob,
  hasPendingJob,
  type Job,
} from "./jobs";
import { log } from "./logger";
import { getUserRole } from "./users";

export async function getUsersDueForDigest(): Promise<User[]> {
  const rows = await db`
    SELECT * FROM users
    WHERE is_active = true
      AND consented_to_emails = true
      AND EXTRACT(ISODOW FROM now() AT TIME ZONE timezone) = digest_day + 1
      AND EXTRACT(HOUR FROM now() AT TIME ZONE timezone) = digest_hour
  `;
  return rows as User[];
}

export async function getUsersDueForSync(): Promise<User[]> {
  const rows = await db`
    SELECT * FROM users
    WHERE is_active = true
      AND consented_to_emails = true
      AND EXTRACT(ISODOW FROM (now() + interval '30 minutes') AT TIME ZONE timezone) = digest_day + 1
      AND EXTRACT(HOUR FROM (now() + interval '30 minutes') AT TIME ZONE timezone) = digest_hour
  `;
  return rows as User[];
}

export async function dispatchDigests(): Promise<void> {
  const users = await getUsersDueForDigest();
  let enqueued = 0;

  for (const user of users) {
    const pending = await hasPendingJob("send_digest", user.id);
    if (pending) continue;
    await enqueueJob("send_digest", user.id);
    enqueued++;
  }

  log.info("dispatcher", `dispatched ${enqueued} send_digest jobs`);
}

export async function dispatchSyncs(): Promise<void> {
  const users = await getUsersDueForSync();
  let enqueued = 0;

  for (const user of users) {
    const pending = await hasPendingJob("sync_stars", user.id);
    if (pending) continue;
    await enqueueJob("sync_stars", user.id);
    enqueued++;
  }

  log.info("dispatcher", `dispatched ${enqueued} sync_stars jobs`);
}

async function executeJob(job: Job): Promise<void> {
  switch (job.type) {
    case "sync_stars":
      await executeSyncStars(job);
      break;
    case "send_digest":
      await executeSendDigest(job);
      break;
  }
}

export function startDispatcher(): () => void {
  const schedulerInterval = setInterval(async () => {
    try {
      const minute = new Date().getMinutes();
      if (minute === 30) {
        await dispatchSyncs();
      }
      if (minute === 0) {
        await dispatchDigests();
      }
    } catch (error) {
      log.error(
        "dispatcher",
        `scheduler error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, 60_000);

  const workerInterval = setInterval(async () => {
    try {
      const job = await claimNextJob();
      if (!job) return;

      const jobRole = await getUserRole(job.user_id);

      try {
        await executeJob(job);
        await completeJob(job.id);
      } catch (error) {
        await failJob(
          job.id,
          error instanceof Error ? error.message : String(error),
        );
        if (job.type === "send_digest") {
          trackEvent("digest_failed", { role: jobRole ?? undefined }).catch(
            (err) => {
              log.warn(
                "dispatcher",
                `Failed to track digest_failed event: ${err}`,
              );
            },
          );
        }
      }
    } catch (error) {
      log.error(
        "dispatcher",
        `worker error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, 1_000);

  return () => {
    clearInterval(schedulerInterval);
    clearInterval(workerInterval);
  };
}

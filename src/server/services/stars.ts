import { db } from "./database";
import type { UserRole } from "./events";
import { trackEvent } from "./events";
import { fetchAllStarredRepos } from "./github-api";
import { log } from "./logger";

export const syncUserStars = async (
  userId: string,
  accessToken: string,
  role?: UserRole,
): Promise<void> => {
  await db`UPDATE users SET sync_status = 'syncing' WHERE id = ${userId}`;

  try {
    const repos = await fetchAllStarredRepos(accessToken);
    log.info(
      "stars",
      `Fetched ${repos.length} starred repos for user ${userId}`,
    );

    if (repos.length === 0) {
      await db`DELETE FROM stars WHERE user_id = ${userId}`;
      await db`UPDATE users SET sync_status = 'done' WHERE id = ${userId}`;
      return;
    }

    for (const repo of repos) {
      await db`
        INSERT INTO stars (user_id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at)
        VALUES (
          ${userId},
          ${repo.repo_id},
          ${repo.full_name},
          ${repo.description},
          ${repo.language},
          ${repo.stargazers_count},
          ${repo.html_url},
          ${repo.starred_at},
          ${repo.last_activity_at}
        )
        ON CONFLICT (user_id, repo_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          description = EXCLUDED.description,
          language = EXCLUDED.language,
          stargazers_count = EXCLUDED.stargazers_count,
          html_url = EXCLUDED.html_url,
          starred_at = EXCLUDED.starred_at,
          last_activity_at = EXCLUDED.last_activity_at,
          updated_at = now()
      `;
    }

    const repoIds = repos.map((r) => r.repo_id);
    await db`
      DELETE FROM stars
      WHERE user_id = ${userId}
      AND repo_id NOT IN ${db(repoIds)}
    `;

    await db`UPDATE users SET sync_status = 'done' WHERE id = ${userId}`;

    trackEvent("stars_synced", { count: repos.length }, { role }).catch(
      (err) => {
        log.warn("events", `Failed to track stars_synced: ${err}`);
      },
    );
  } catch (error) {
    await db`UPDATE users SET sync_status = 'error' WHERE id = ${userId}`;
    trackEvent("star_sync_failed", { role }).catch((err) => {
      log.warn("events", `Failed to track star_sync_failed: ${err}`);
    });
    throw error;
  }
};

export const getStarCount = async (userId: string): Promise<number> => {
  const result = await db`
    SELECT COUNT(*) as count FROM stars WHERE user_id = ${userId}
  `;
  return Number(result[0].count);
};

export const getSyncStatus = async (
  userId: string,
): Promise<{ status: string; count: number }> => {
  const result = await db`
    SELECT u.sync_status, COUNT(s.id) as count
    FROM users u
    LEFT JOIN stars s ON s.user_id = u.id
    WHERE u.id = ${userId}
    GROUP BY u.sync_status
  `;
  return {
    status: result[0].sync_status as string,
    count: Number(result[0].count),
  };
};

import { db } from "./database";
import { fetchAllStarredRepos } from "./github-api";
import { log } from "./logger";

export const syncUserStars = async (
  userId: string,
  accessToken: string,
): Promise<void> => {
  const repos = await fetchAllStarredRepos(accessToken);
  log.info("stars", `Fetched ${repos.length} starred repos for user ${userId}`);

  if (repos.length === 0) {
    await db`DELETE FROM stars WHERE user_id = ${userId}`;
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
};

export const getStarCount = async (userId: string): Promise<number> => {
  const result = await db`
    SELECT COUNT(*) as count FROM stars WHERE user_id = ${userId}
  `;
  return Number(result[0].count);
};

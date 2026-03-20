import { db } from "./database";
import { log } from "./logger";

export interface SelectedRepo {
  starId: string;
  cycle: number;
  repoId: number;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  htmlUrl: string;
  starredAt: Date | null;
  lastActivityAt: Date | null;
  isArchived: boolean;
}

interface StarRow {
  id: string;
  repo_id: number;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  starred_at: Date | null;
  last_activity_at: Date | null;
  is_archived: boolean;
}

export interface DigestOptions {
  userId: string;
  excludeOwner?: string;
}

const rowToSelectedRepo = (row: StarRow, cycle: number): SelectedRepo => ({
  starId: row.id,
  cycle,
  repoId: Number(row.repo_id),
  fullName: row.full_name,
  description: row.description,
  language: row.language,
  stargazersCount: Number(row.stargazers_count),
  htmlUrl: row.html_url,
  starredAt: row.starred_at,
  lastActivityAt: row.last_activity_at,
  isArchived: Boolean(row.is_archived),
});

const ownerPrefix = (owner: string) => `${owner}/%`;

export const selectReposForDigest = async (
  options: DigestOptions,
): Promise<SelectedRepo[]> => {
  const { userId, excludeOwner } = options;
  const ownerPattern = excludeOwner ? ownerPrefix(excludeOwner) : null;

  const countResult = ownerPattern
    ? await db`SELECT COUNT(*)::int AS total FROM stars WHERE user_id = ${userId} AND full_name NOT LIKE ${ownerPattern}`
    : await db`SELECT COUNT(*)::int AS total FROM stars WHERE user_id = ${userId}`;
  const totalStars = countResult[0].total as number;

  if (totalStars === 0) {
    return [];
  }

  const cycleResult = await db`
    SELECT COALESCE(MAX(cycle), 0)::int AS max_cycle
    FROM digest_history
    WHERE user_id = ${userId}
  `;
  const currentCycle = Math.max(1, cycleResult[0].max_cycle as number);

  const sentIds = await db`
    SELECT star_id FROM digest_history
    WHERE user_id = ${userId} AND cycle = ${currentCycle}
  `;
  const sentIdList = sentIds.map(
    (r: { star_id: string }) => r.star_id as string,
  );

  let unseen: StarRow[];
  if (sentIdList.length === 0) {
    unseen = ownerPattern
      ? ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND full_name NOT LIKE ${ownerPattern}
          ORDER BY random()
        `) as StarRow[])
      : ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId}
          ORDER BY random()
        `) as StarRow[]);
  } else {
    unseen = ownerPattern
      ? ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND id NOT IN ${db(sentIdList)} AND full_name NOT LIKE ${ownerPattern}
          ORDER BY random()
        `) as StarRow[])
      : ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND id NOT IN ${db(sentIdList)}
          ORDER BY random()
        `) as StarRow[]);
  }

  if (unseen.length === 0) {
    const newCycle = currentCycle + 1;
    const picks = ownerPattern
      ? ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND full_name NOT LIKE ${ownerPattern}
          ORDER BY random()
          LIMIT 3
        `) as StarRow[])
      : ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId}
          ORDER BY random()
          LIMIT 3
        `) as StarRow[]);
    const results = picks.map((row) => rowToSelectedRepo(row, newCycle));
    log.info("digest", `Selected ${results.length} repos for user ${userId}`);
    return results;
  }

  if (unseen.length >= 3) {
    const results = unseen
      .slice(0, 3)
      .map((row) => rowToSelectedRepo(row, currentCycle));
    log.info("digest", `Selected ${results.length} repos for user ${userId}`);
    return results;
  }

  const results: SelectedRepo[] = unseen.map((row) =>
    rowToSelectedRepo(row, currentCycle),
  );
  const remaining = 3 - unseen.length;
  const newCycle = currentCycle + 1;
  const excludeIds = unseen.map((r) => r.id);

  let fill: StarRow[];
  if (excludeIds.length === 0) {
    fill = ownerPattern
      ? ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND full_name NOT LIKE ${ownerPattern}
          ORDER BY random()
          LIMIT ${remaining}
        `) as StarRow[])
      : ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId}
          ORDER BY random()
          LIMIT ${remaining}
        `) as StarRow[]);
  } else {
    fill = ownerPattern
      ? ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND id NOT IN ${db(excludeIds)} AND full_name NOT LIKE ${ownerPattern}
          ORDER BY random()
          LIMIT ${remaining}
        `) as StarRow[])
      : ((await db`
          SELECT id, repo_id, full_name, description, language, stargazers_count, html_url, starred_at, last_activity_at, is_archived
          FROM stars
          WHERE user_id = ${userId} AND id NOT IN ${db(excludeIds)}
          ORDER BY random()
          LIMIT ${remaining}
        `) as StarRow[]);
  }

  results.push(...fill.map((row) => rowToSelectedRepo(row, newCycle)));
  log.info("digest", `Selected ${results.length} repos for user ${userId}`);
  return results;
};

export const getDigestProgress = async (
  userId: string,
): Promise<{ seen: number; total: number; cycle: number }> => {
  const totalResult = await db`
    SELECT COUNT(*) as count FROM stars WHERE user_id = ${userId}
  `;
  const total = Number(totalResult[0].count);

  const cycleResult = await db`
    SELECT COALESCE(MAX(cycle), 0) as current_cycle
    FROM digest_history
    WHERE user_id = ${userId}
  `;
  const cycle = Math.max(1, Number(cycleResult[0].current_cycle));

  const seenResult = await db`
    SELECT COUNT(*) as count
    FROM digest_history
    WHERE user_id = ${userId} AND cycle = ${cycle}
  `;
  const seen = Number(seenResult[0].count);

  return { seen, total, cycle };
};

export const recordDigestSelections = async (
  userId: string,
  selections: { starId: string; cycle: number }[],
): Promise<void> => {
  await db.begin(async (tx) => {
    for (const sel of selections) {
      await tx`
        INSERT INTO digest_history (user_id, star_id, cycle)
        VALUES (${userId}, ${sel.starId}, ${sel.cycle})
      `;
    }
  });
};

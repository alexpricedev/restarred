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

const mockFetchAllStarredRepos =
  mock<
    () => Promise<
      Array<{
        repo_id: number;
        full_name: string;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        html_url: string;
        starred_at: string | null;
        last_activity_at: string | null;
      }>
    >
  >();

mock.module("./github-api", () => ({
  fetchAllStarredRepos: mockFetchAllStarredRepos,
}));

import { db } from "./database";

const makeRepo = (id: number, name: string) => ({
  repo_id: id,
  full_name: name,
  description: `Description for ${name}`,
  language: "TypeScript",
  stargazers_count: 10,
  html_url: `https://github.com/${name}`,
  starred_at: "2024-01-15T10:00:00Z",
  last_activity_at: "2024-06-01T12:00:00Z",
});

describe("stars service", () => {
  let userId: string;

  beforeEach(async () => {
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;

    const users = await db`
      INSERT INTO users (id, github_id, github_username, github_email, github_token)
      VALUES (gen_random_uuid(), 99999, 'testuser', 'test@example.com', 'encrypted-token')
      RETURNING id
    `;
    userId = users[0].id as string;

    mockFetchAllStarredRepos.mockReset();
  });

  afterEach(async () => {
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("syncUserStars inserts starred repos on first sync", async () => {
    const { syncUserStars } = await import("./stars");

    mockFetchAllStarredRepos.mockResolvedValueOnce([
      makeRepo(1, "owner/repo-a"),
      makeRepo(2, "owner/repo-b"),
    ]);

    await syncUserStars(userId, "access-token");

    const stars =
      await db`SELECT * FROM stars WHERE user_id = ${userId} ORDER BY repo_id`;
    expect(stars).toHaveLength(2);
    expect(stars[0].full_name).toBe("owner/repo-a");
    expect(stars[1].full_name).toBe("owner/repo-b");
  });

  test("syncUserStars updates existing repos on re-sync", async () => {
    const { syncUserStars } = await import("./stars");

    mockFetchAllStarredRepos.mockResolvedValueOnce([
      makeRepo(1, "owner/repo-a"),
    ]);
    await syncUserStars(userId, "access-token");

    // Re-sync with updated star count
    mockFetchAllStarredRepos.mockResolvedValueOnce([
      { ...makeRepo(1, "owner/repo-a"), stargazers_count: 999 },
    ]);
    await syncUserStars(userId, "access-token");

    const stars = await db`SELECT * FROM stars WHERE user_id = ${userId}`;
    expect(stars).toHaveLength(1);
    expect(Number(stars[0].stargazers_count)).toBe(999);
  });

  test("syncUserStars prunes unstarred repos", async () => {
    const { syncUserStars } = await import("./stars");

    mockFetchAllStarredRepos.mockResolvedValueOnce([
      makeRepo(1, "owner/repo-a"),
      makeRepo(2, "owner/repo-b"),
    ]);
    await syncUserStars(userId, "access-token");

    // Re-sync with only repo-b (repo-a was unstarred)
    mockFetchAllStarredRepos.mockResolvedValueOnce([
      makeRepo(2, "owner/repo-b"),
    ]);
    await syncUserStars(userId, "access-token");

    const stars = await db`SELECT * FROM stars WHERE user_id = ${userId}`;
    expect(stars).toHaveLength(1);
    expect(stars[0].full_name).toBe("owner/repo-b");
  });

  test("syncUserStars handles empty star list", async () => {
    const { syncUserStars } = await import("./stars");

    // Start with some stars
    mockFetchAllStarredRepos.mockResolvedValueOnce([
      makeRepo(1, "owner/repo-a"),
    ]);
    await syncUserStars(userId, "access-token");

    // Sync with empty list (user unstarred everything)
    mockFetchAllStarredRepos.mockResolvedValueOnce([]);
    await syncUserStars(userId, "access-token");

    const stars = await db`SELECT * FROM stars WHERE user_id = ${userId}`;
    expect(stars).toHaveLength(0);
  });

  test("getStarCount returns count for user", async () => {
    const { syncUserStars, getStarCount } = await import("./stars");

    mockFetchAllStarredRepos.mockResolvedValueOnce([
      makeRepo(1, "owner/repo-a"),
      makeRepo(2, "owner/repo-b"),
      makeRepo(3, "owner/repo-c"),
    ]);
    await syncUserStars(userId, "access-token");

    const count = await getStarCount(userId);
    expect(count).toBe(3);
  });

  test("getStarCount returns 0 for user with no stars", async () => {
    const { getStarCount } = await import("./stars");

    const count = await getStarCount(userId);
    expect(count).toBe(0);
  });
});

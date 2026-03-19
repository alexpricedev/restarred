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

const seedStars = async (userId: string, count: number) => {
  const stars: string[] = [];
  for (let i = 0; i < count; i++) {
    const result = await db`
      INSERT INTO stars (user_id, repo_id, full_name, html_url, stargazers_count)
      VALUES (${userId}, ${i + 1}, ${`owner/repo-${i + 1}`}, ${`https://github.com/owner/repo-${i + 1}`}, ${10})
      RETURNING id
    `;
    stars.push(result[0].id as string);
  }
  return stars;
};

describe("digest service", () => {
  let userId: string;

  beforeEach(async () => {
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
    await db`DELETE FROM digest_history`;
    await db`DELETE FROM stars`;
    await db`DELETE FROM sessions`;
    await db`DELETE FROM users`;
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("selectReposForDigest returns 3 repos when user has many stars", async () => {
    const { selectReposForDigest } = await import("./digest");

    await seedStars(userId, 10);

    const results = await selectReposForDigest(userId);
    expect(results).toHaveLength(3);
    for (const repo of results) {
      expect(repo.cycle).toBe(1);
    }
  });

  test("selectReposForDigest returns all stars when user has fewer than 3", async () => {
    const { selectReposForDigest } = await import("./digest");

    await seedStars(userId, 2);

    const results = await selectReposForDigest(userId);
    expect(results).toHaveLength(2);
  });

  test("selectReposForDigest returns empty array when user has no stars", async () => {
    const { selectReposForDigest } = await import("./digest");

    const results = await selectReposForDigest(userId);
    expect(results).toEqual([]);
  });

  test("selectReposForDigest does not repeat repos within a cycle", async () => {
    const { selectReposForDigest, recordDigestSelections } = await import(
      "./digest"
    );

    await seedStars(userId, 10);

    const allIds: string[] = [];

    for (let i = 0; i < 3; i++) {
      const results = await selectReposForDigest(userId);
      expect(results).toHaveLength(3);
      await recordDigestSelections(
        userId,
        results.map((r) => ({ starId: r.starId, cycle: r.cycle })),
      );
      allIds.push(...results.map((r) => r.starId));
    }

    expect(allIds).toHaveLength(9);
    expect(new Set(allIds).size).toBe(9);
  });

  test("selectReposForDigest wraps cycle when fewer than 3 unseen remain", async () => {
    const { selectReposForDigest, recordDigestSelections } = await import(
      "./digest"
    );

    await seedStars(userId, 5);

    const first = await selectReposForDigest(userId);
    expect(first).toHaveLength(3);
    await recordDigestSelections(
      userId,
      first.map((r) => ({ starId: r.starId, cycle: r.cycle })),
    );

    const second = await selectReposForDigest(userId);
    expect(second).toHaveLength(3);

    const cycle1Count = second.filter((r) => r.cycle === 1).length;
    const cycle2Count = second.filter((r) => r.cycle === 2).length;
    expect(cycle1Count).toBe(2);
    expect(cycle2Count).toBe(1);
  });

  test("selectReposForDigest starts new cycle when all stars seen", async () => {
    const { selectReposForDigest, recordDigestSelections } = await import(
      "./digest"
    );

    await seedStars(userId, 3);

    const first = await selectReposForDigest(userId);
    expect(first).toHaveLength(3);
    await recordDigestSelections(
      userId,
      first.map((r) => ({ starId: r.starId, cycle: r.cycle })),
    );

    const second = await selectReposForDigest(userId);
    expect(second).toHaveLength(3);
    for (const repo of second) {
      expect(repo.cycle).toBe(2);
    }
  });
});

import { randomUUID } from "node:crypto";
import type { SQL } from "bun";

/**
 * Clean up test data between tests
 * Truncates all tables to provide test isolation
 *
 * @param db - The database connection to use (should be the mocked testDb from each test file)
 */
export const cleanupTestData = async (db: SQL): Promise<void> => {
  await db`TRUNCATE TABLE sessions CASCADE`;
  await db`TRUNCATE TABLE users CASCADE`;
};

/**
 * Create a test user with GitHub fields for use in integration tests.
 * Returns the created user row.
 */
export const createTestUser = async (
  db: SQL,
  overrides: {
    githubId?: number;
    githubUsername?: string;
    githubEmail?: string;
    role?: "user" | "admin";
  } = {},
): Promise<{
  id: string;
  github_id: number;
  github_username: string;
  github_email: string;
  role: "user" | "admin";
}> => {
  const id = randomUUID();
  const githubId = overrides.githubId ?? Math.floor(Math.random() * 1_000_000);
  const githubUsername = overrides.githubUsername ?? `testuser-${githubId}`;
  const githubEmail = overrides.githubEmail ?? `${githubUsername}@example.com`;
  const role = overrides.role ?? "user";

  const result = await db`
    INSERT INTO users (id, github_id, github_username, github_email, role)
    VALUES (${id}, ${githubId}, ${githubUsername}, ${githubEmail}, ${role})
    RETURNING *
  `;

  return result[0] as {
    id: string;
    github_id: number;
    github_username: string;
    github_email: string;
    role: "user" | "admin";
  };
};

/**
 * Generate a random email address for testing
 * Uses timestamp and random string to ensure uniqueness
 *
 * @param domain - Optional domain, defaults to "example.com"
 * @returns A unique email address for testing
 */
export const randomEmail = (domain = "example.com"): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@${domain}`;
};

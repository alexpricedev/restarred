#!/usr/bin/env bun
import { db } from "../services/database";
import { log } from "../services/logger";

export const seedIfEmpty = async (): Promise<void> => {
  const [{ count: userCount }] =
    await db`SELECT count(*)::int AS count FROM users`;

  if (userCount > 0) return;

  log.info("seed", "Empty database detected — seeding starter data");

  await db`
    INSERT INTO users (github_id, github_username, github_email, role) VALUES
      (1001, 'admin-user', 'admin@example.com', 'admin'),
      (1002, 'alice', 'alice@example.com', 'user'),
      (1003, 'bob', 'bob@example.com', 'user')
    ON CONFLICT (github_id) DO NOTHING
  `;

  log.info("seed", "Seeded 3 users");
};

// Allow running directly via `bun run seed`
if (import.meta.main) {
  seedIfEmpty()
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}

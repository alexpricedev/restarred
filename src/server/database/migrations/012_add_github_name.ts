import type { SQL } from "bun";

export async function up(db: SQL): Promise<void> {
  await db`ALTER TABLE users ADD COLUMN github_name TEXT`;
}

export async function down(db: SQL): Promise<void> {
  await db`ALTER TABLE users DROP COLUMN github_name`;
}

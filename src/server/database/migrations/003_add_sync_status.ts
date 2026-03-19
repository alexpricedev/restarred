import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE users
    ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'idle'
  `;
};

export const down = async (db: SQL): Promise<void> => {
  await db`ALTER TABLE users DROP COLUMN sync_status`;
};

import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`ALTER TABLE users DROP COLUMN has_viewed_first`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`ALTER TABLE users ADD COLUMN has_viewed_first BOOLEAN NOT NULL DEFAULT false`;
};

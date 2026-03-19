import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE stars
    ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false
  `;
};

export const down = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE stars
    DROP COLUMN is_archived
  `;
};

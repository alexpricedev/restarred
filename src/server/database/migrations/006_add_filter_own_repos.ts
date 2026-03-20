import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE users
    ADD COLUMN filter_own_repos BOOLEAN NOT NULL DEFAULT true
  `;
};

export const down = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE users
    DROP COLUMN filter_own_repos
  `;
};

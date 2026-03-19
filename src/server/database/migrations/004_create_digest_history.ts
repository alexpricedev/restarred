import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    CREATE TABLE digest_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      star_id UUID NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
      cycle INTEGER NOT NULL DEFAULT 1,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`CREATE INDEX idx_digest_history_user_cycle ON digest_history(user_id, cycle)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS digest_history`;
};

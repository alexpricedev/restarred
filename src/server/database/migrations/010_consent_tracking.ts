import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE users
    ADD COLUMN consented_to_emails BOOLEAN NOT NULL DEFAULT false
  `;

  await db`
    ALTER TABLE users
    ADD COLUMN consented_at TIMESTAMPTZ
  `;

  await db`
    ALTER TABLE users
    ALTER COLUMN is_active SET DEFAULT false
  `;

  await db`
    UPDATE users
    SET consented_to_emails = true, consented_at = created_at
    WHERE is_active = true
  `;

  await db`
    CREATE TABLE consent_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      consent_type TEXT NOT NULL,
      consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip_address TEXT,
      user_agent TEXT
    )
  `;

  await db`CREATE INDEX idx_consent_records_user_id ON consent_records(user_id)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS consent_records`;
  await db`ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true`;
  await db`ALTER TABLE users DROP COLUMN consented_at`;
  await db`ALTER TABLE users DROP COLUMN consented_to_emails`;
};

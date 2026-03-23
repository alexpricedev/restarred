import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    CREATE TABLE email_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`CREATE UNIQUE INDEX idx_email_verifications_user_id ON email_verifications(user_id)`;
  await db`CREATE INDEX idx_email_verifications_token_hash ON email_verifications(token_hash)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS email_verifications`;
};

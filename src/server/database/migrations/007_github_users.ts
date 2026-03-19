import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS user_tokens`;
  await db`DROP TABLE IF EXISTS project`;

  await db`ALTER TABLE users DROP COLUMN IF EXISTS email`;
  await db`ALTER TABLE users ADD COLUMN github_id INTEGER UNIQUE`;
  await db`ALTER TABLE users ADD COLUMN github_username TEXT`;
  await db`ALTER TABLE users ADD COLUMN github_email TEXT`;
  await db`ALTER TABLE users ADD COLUMN email_override TEXT`;
  await db`ALTER TABLE users ADD COLUMN github_token TEXT`;
  await db`ALTER TABLE users ADD COLUMN digest_day INTEGER NOT NULL DEFAULT 0`;
  await db`ALTER TABLE users ADD COLUMN digest_hour INTEGER NOT NULL DEFAULT 8`;
  await db`ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Europe/London'`;
  await db`ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true`;
  await db`ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`ALTER TABLE users DROP COLUMN IF EXISTS updated_at`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS is_active`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS timezone`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS digest_hour`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS digest_day`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS github_token`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS email_override`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS github_email`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS github_username`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS github_id`;
  await db`ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE`;

  await db`
    CREATE TABLE user_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      type VARCHAR(50) NOT NULL DEFAULT 'magic_link',
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`
    CREATE TABLE project (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      created_by TEXT
    )
  `;
};

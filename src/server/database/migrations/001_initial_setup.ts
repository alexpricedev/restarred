import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      github_id INTEGER UNIQUE,
      github_username TEXT,
      github_email TEXT,
      email_override TEXT,
      github_token TEXT,
      digest_day INTEGER NOT NULL DEFAULT 0,
      digest_hour INTEGER NOT NULL DEFAULT 8,
      timezone TEXT NOT NULL DEFAULT 'Europe/London',
      is_active BOOLEAN NOT NULL DEFAULT true,
      role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`
    CREATE TABLE sessions (
      id_hash TEXT PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      session_type VARCHAR(20) NOT NULL DEFAULT 'authenticated',
      csrf_secret TEXT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`CREATE INDEX idx_sessions_user_id ON sessions(user_id)`;
  await db`CREATE INDEX idx_sessions_expires_at ON sessions(expires_at)`;
  await db`CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at)`;
  await db`CREATE INDEX idx_sessions_csrf_secret ON sessions(csrf_secret) WHERE csrf_secret IS NOT NULL`;
  await db`CREATE INDEX idx_sessions_session_type ON sessions(session_type)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS sessions`;
  await db`DROP TABLE IF EXISTS users`;
};

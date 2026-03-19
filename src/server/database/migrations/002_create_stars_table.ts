import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    CREATE TABLE stars (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      repo_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      description TEXT,
      language TEXT,
      stargazers_count INTEGER NOT NULL DEFAULT 0,
      html_url TEXT NOT NULL,
      starred_at TIMESTAMPTZ,
      last_activity_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, repo_id)
    )
  `;

  await db`CREATE INDEX idx_stars_user_id ON stars(user_id)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS stars`;
};

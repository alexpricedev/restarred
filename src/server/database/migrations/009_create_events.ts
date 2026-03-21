import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    CREATE TABLE events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      role TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`CREATE INDEX idx_events_type ON events(type)`;
  await db`CREATE INDEX idx_events_created_at ON events(created_at)`;
  await db`CREATE INDEX idx_events_role ON events(role)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS events`;
};

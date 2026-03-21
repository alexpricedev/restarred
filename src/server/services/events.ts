import { db } from "./database";

export type UserRole = "user" | "admin";

export type EventRole = "user" | "admin" | "guest";

export type EventType =
  | "signup"
  | "login"
  | "account_deletion"
  | "account_view"
  | "settings_changed"
  | "digest_sent"
  | "digest_failed"
  | "unsubscribe"
  | "resubscribe"
  | "stars_synced"
  | "star_sync_failed"
  | "homepage_view";

export interface EventMetadata {
  signup: never;
  login: never;
  account_deletion: never;
  account_view: never;
  settings_changed: { fields: string[] };
  digest_sent: never;
  digest_failed: never;
  unsubscribe: never;
  resubscribe: never;
  stars_synced: { count: number };
  star_sync_failed: never;
  homepage_view: never;
}

type HasMetadata<T extends EventType> = EventMetadata[T] extends never
  ? never
  : EventMetadata[T];

type TrackEventArgs<T extends EventType> = HasMetadata<T> extends never
  ? [options?: { role?: EventRole }]
  : [metadata: HasMetadata<T>, options?: { role?: EventRole }];

export async function trackEvent<T extends EventType>(
  type: T,
  ...args: TrackEventArgs<T>
): Promise<void> {
  let metadata: unknown = null;
  let role: EventRole | null = null;

  const firstArg = args[0];
  if (firstArg && typeof firstArg === "object" && "role" in firstArg) {
    role = (firstArg as { role?: EventRole }).role ?? null;
  } else if (firstArg != null) {
    metadata = firstArg;
    const secondArg = args[1] as { role?: EventRole } | undefined;
    role = secondArg?.role ?? null;
  }

  await db`
    INSERT INTO events (type, role, metadata)
    VALUES (${type}, ${role}, ${metadata ?? null})
  `;
}

export type RoleFilter = "user" | "admin" | "guest" | "all";

export async function countEvents(
  type: EventType,
  since?: Date,
  roleFilter?: RoleFilter,
): Promise<number> {
  const roleClause = roleFilter && roleFilter !== "all" ? roleFilter : null;

  if (since && roleClause) {
    const result = await db`
      SELECT COUNT(*)::int AS count FROM events
      WHERE type = ${type} AND created_at >= ${since.toISOString()} AND role = ${roleClause}
    `;
    return result[0].count as number;
  }
  if (since) {
    const result = await db`
      SELECT COUNT(*)::int AS count FROM events
      WHERE type = ${type} AND created_at >= ${since.toISOString()}
    `;
    return result[0].count as number;
  }
  if (roleClause) {
    const result = await db`
      SELECT COUNT(*)::int AS count FROM events
      WHERE type = ${type} AND role = ${roleClause}
    `;
    return result[0].count as number;
  }
  const result = await db`
    SELECT COUNT(*)::int AS count FROM events WHERE type = ${type}
  `;
  return result[0].count as number;
}

export async function sumEventMetadata(
  type: EventType,
  field: string,
  since?: Date,
  roleFilter?: RoleFilter,
): Promise<number> {
  const roleClause = roleFilter && roleFilter !== "all" ? roleFilter : null;

  if (since && roleClause) {
    const result = await db`
      SELECT COALESCE(SUM((metadata->>${field})::int), 0)::int AS total
      FROM events
      WHERE type = ${type} AND created_at >= ${since.toISOString()} AND role = ${roleClause}
    `;
    return result[0].total as number;
  }
  if (since) {
    const result = await db`
      SELECT COALESCE(SUM((metadata->>${field})::int), 0)::int AS total
      FROM events
      WHERE type = ${type} AND created_at >= ${since.toISOString()}
    `;
    return result[0].total as number;
  }
  if (roleClause) {
    const result = await db`
      SELECT COALESCE(SUM((metadata->>${field})::int), 0)::int AS total
      FROM events WHERE type = ${type} AND role = ${roleClause}
    `;
    return result[0].total as number;
  }
  const result = await db`
    SELECT COALESCE(SUM((metadata->>${field})::int), 0)::int AS total
    FROM events WHERE type = ${type}
  `;
  return result[0].total as number;
}

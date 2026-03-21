import { db } from "./database";
import { countEvents, type RoleFilter, sumEventMetadata } from "./events";

export type VisitorStats = {
  visitorCount: number;
  lastUpdated: string;
};

export const getVisitorStats = (): VisitorStats => {
  const mockVisitorCount = Math.floor(Date.now() / 1000) % 10000;

  return {
    visitorCount: mockVisitorCount,
    lastUpdated: new Date().toISOString(),
  };
};

export interface AdminStats {
  lifetimeSignups: number;
  accountDeletions: number;
  totalUsers: number;
  activeUsers: number;
  signupsThisWeek: number;
  signupsThisMonth: number;
  logins: number;
  loginsThisWeek: number;
  accountViews: number;
  settingsChanges: number;
  totalStarsSynced: number;
  starSyncFailures: number;
  digestsSent: number;
  digestsThisWeek: number;
  digestFailures: number;
  unsubscribes: number;
  resubscribes: number;
  homepageViews: number;
  homepageViewsThisWeek: number;
}

export const getAdminStats = async (
  roleFilter: RoleFilter = "user",
): Promise<AdminStats> => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    lifetimeSignups,
    accountDeletions,
    users,
    active,
    signupsThisWeek,
    signupsThisMonth,
    logins,
    loginsThisWeek,
    accountViews,
    settingsChanges,
    totalStarsSynced,
    starSyncFailures,
    digestsSent,
    digestsThisWeek,
    digestFailures,
    unsubscribes,
    resubscribes,
    homepageViews,
    homepageViewsThisWeek,
  ] = await Promise.all([
    countEvents("signup", undefined, roleFilter),
    countEvents("account_deletion", undefined, roleFilter),
    roleFilter === "all"
      ? db`SELECT COUNT(*)::int AS count FROM users`
      : db`SELECT COUNT(*)::int AS count FROM users WHERE role = ${roleFilter}`,
    roleFilter === "all"
      ? db`SELECT COUNT(*)::int AS count FROM users WHERE is_active = true`
      : db`SELECT COUNT(*)::int AS count FROM users WHERE is_active = true AND role = ${roleFilter}`,
    countEvents("signup", weekAgo, roleFilter),
    countEvents("signup", monthAgo, roleFilter),
    countEvents("login", undefined, roleFilter),
    countEvents("login", weekAgo, roleFilter),
    countEvents("account_view", undefined, roleFilter),
    countEvents("settings_changed", undefined, roleFilter),
    sumEventMetadata("stars_synced", "count", undefined, roleFilter),
    countEvents("star_sync_failed", undefined, roleFilter),
    countEvents("digest_sent", undefined, roleFilter),
    countEvents("digest_sent", weekAgo, roleFilter),
    countEvents("digest_failed", undefined, roleFilter),
    countEvents("unsubscribe", undefined, roleFilter),
    countEvents("resubscribe", undefined, roleFilter),
    countEvents("homepage_view", undefined, roleFilter),
    countEvents("homepage_view", weekAgo, roleFilter),
  ]);

  return {
    lifetimeSignups,
    accountDeletions,
    totalUsers: users[0].count as number,
    activeUsers: active[0].count as number,
    signupsThisWeek,
    signupsThisMonth,
    logins,
    loginsThisWeek,
    accountViews,
    settingsChanges,
    totalStarsSynced,
    starSyncFailures,
    digestsSent,
    digestsThisWeek,
    digestFailures,
    unsubscribes,
    resubscribes,
    homepageViews,
    homepageViewsThisWeek,
  };
};

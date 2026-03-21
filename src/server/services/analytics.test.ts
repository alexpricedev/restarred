import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { cleanupTestData, createTestUser } from "../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("./database", () => ({
  get db() {
    return connection;
  },
}));

import { type AdminStats, getAdminStats, getVisitorStats } from "./analytics";
import { db } from "./database";
import { trackEvent } from "./events";

beforeEach(async () => {
  await cleanupTestData(db);
});

afterAll(async () => {
  await cleanupTestData(db);
  connection.close();
});

describe("getVisitorStats", () => {
  test("returns correct structure", () => {
    const stats = getVisitorStats();

    expect(stats).toHaveProperty("visitorCount");
    expect(stats).toHaveProperty("lastUpdated");
    expect(typeof stats.visitorCount).toBe("number");
    expect(typeof stats.lastUpdated).toBe("string");
  });

  test("returns valid ISO timestamp", () => {
    const stats = getVisitorStats();

    const date = new Date(stats.lastUpdated);
    expect(date.toISOString()).toBe(stats.lastUpdated);
  });

  test("returns non-negative visitor count", () => {
    const stats = getVisitorStats();
    expect(stats.visitorCount).toBeGreaterThanOrEqual(0);
  });

  test("returns different counts over time", () => {
    const stats1 = getVisitorStats();

    setTimeout(() => {
      const stats2 = getVisitorStats();
      expect(stats1.lastUpdated).not.toBe(stats2.lastUpdated);
    }, 1);
  });
});

describe("getAdminStats", () => {
  test("returns all zero stats when no data exists", async () => {
    const stats = await getAdminStats();

    const keys: (keyof AdminStats)[] = [
      "lifetimeSignups",
      "accountDeletions",
      "totalUsers",
      "activeUsers",
      "signupsThisWeek",
      "signupsThisMonth",
      "logins",
      "loginsThisWeek",
      "accountViews",
      "settingsChanges",
      "totalStarsSynced",
      "starSyncFailures",
      "digestsSent",
      "digestsThisWeek",
      "digestFailures",
      "unsubscribes",
      "resubscribes",
    ];

    for (const key of keys) {
      expect(stats[key]).toBe(0);
    }
  });

  test("counts signups and logins", async () => {
    await trackEvent("signup", { role: "user" });
    await trackEvent("signup", { role: "user" });
    await trackEvent("login", { role: "user" });

    const stats = await getAdminStats("user");

    expect(stats.lifetimeSignups).toBe(2);
    expect(stats.signupsThisWeek).toBe(2);
    expect(stats.signupsThisMonth).toBe(2);
    expect(stats.logins).toBe(1);
    expect(stats.loginsThisWeek).toBe(1);
  });

  test("counts totalUsers and activeUsers from users table", async () => {
    await createTestUser(db, { role: "user" });
    await createTestUser(db, { role: "user" });
    const inactive = await createTestUser(db, { role: "user" });
    await db`UPDATE users SET is_active = false WHERE id = ${inactive.id}`;

    const stats = await getAdminStats("user");

    expect(stats.totalUsers).toBe(3);
    expect(stats.activeUsers).toBe(2);
  });

  test("counts digest events", async () => {
    await trackEvent("digest_sent", { role: "user" });
    await trackEvent("digest_sent", { role: "user" });
    await trackEvent("digest_failed", { role: "user" });

    const stats = await getAdminStats("user");

    expect(stats.digestsSent).toBe(2);
    expect(stats.digestsThisWeek).toBe(2);
    expect(stats.digestFailures).toBe(1);
  });

  test("counts subscription events", async () => {
    await trackEvent("unsubscribe", { role: "user" });
    await trackEvent("resubscribe", { role: "user" });
    await trackEvent("unsubscribe", { role: "user" });

    const stats = await getAdminStats("user");

    expect(stats.unsubscribes).toBe(2);
    expect(stats.resubscribes).toBe(1);
  });

  test("sums stars_synced metadata", async () => {
    await trackEvent("stars_synced", { count: 10 }, { role: "user" });
    await trackEvent("stars_synced", { count: 25 }, { role: "user" });
    await trackEvent("star_sync_failed", { role: "user" });

    const stats = await getAdminStats("user");

    expect(stats.totalStarsSynced).toBe(35);
    expect(stats.starSyncFailures).toBe(1);
  });

  test("counts account events", async () => {
    await trackEvent("account_view", { role: "user" });
    await trackEvent("account_view", { role: "user" });
    await trackEvent(
      "settings_changed",
      { fields: ["email"] },
      { role: "user" },
    );
    await trackEvent("account_deletion", { role: "user" });

    const stats = await getAdminStats("user");

    expect(stats.accountViews).toBe(2);
    expect(stats.settingsChanges).toBe(1);
    expect(stats.accountDeletions).toBe(1);
  });

  test("filters by role", async () => {
    await trackEvent("signup", { role: "user" });
    await trackEvent("signup", { role: "admin" });
    await trackEvent("signup", { role: "user" });

    const userStats = await getAdminStats("user");
    expect(userStats.lifetimeSignups).toBe(2);

    const adminStats = await getAdminStats("admin");
    expect(adminStats.lifetimeSignups).toBe(1);

    const allStats = await getAdminStats("all");
    expect(allStats.lifetimeSignups).toBe(3);
  });

  test("role filter applies to users table queries", async () => {
    await createTestUser(db, { role: "user" });
    await createTestUser(db, { role: "admin" });
    await createTestUser(db, { role: "user" });

    const userStats = await getAdminStats("user");
    expect(userStats.totalUsers).toBe(2);

    const adminStats = await getAdminStats("admin");
    expect(adminStats.totalUsers).toBe(1);

    const allStats = await getAdminStats("all");
    expect(allStats.totalUsers).toBe(3);
  });
});

import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { cleanupTestData } from "../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("./database", () => ({
  get db() {
    return connection;
  },
}));

import { db } from "./database";
import { countEvents, sumEventMetadata, trackEvent } from "./events";

beforeEach(async () => {
  await cleanupTestData(db);
});

afterAll(async () => {
  await cleanupTestData(db);
  connection.close();
});

describe("trackEvent", () => {
  test("inserts an event with no metadata or role", async () => {
    await trackEvent("signup");

    const rows = await db`SELECT * FROM events WHERE type = 'signup'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("signup");
    expect(rows[0].role).toBeNull();
    expect(rows[0].metadata).toBeNull();
  });

  test("inserts an event with a role", async () => {
    await trackEvent("login", { role: "admin" });

    const rows = await db`SELECT * FROM events WHERE type = 'login'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].role).toBe("admin");
  });

  test("inserts an event with metadata", async () => {
    await trackEvent("stars_synced", { count: 42 });

    const rows = await db`SELECT * FROM events WHERE type = 'stars_synced'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].metadata).toEqual({ count: 42 });
  });

  test("inserts an event with metadata and role", async () => {
    await trackEvent("stars_synced", { count: 10 }, { role: "user" });

    const rows = await db`SELECT * FROM events WHERE type = 'stars_synced'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].metadata).toEqual({ count: 10 });
    expect(rows[0].role).toBe("user");
  });

  test("inserts an event with array metadata", async () => {
    await trackEvent("settings_changed", { fields: ["email", "frequency"] });

    const rows = await db`SELECT * FROM events WHERE type = 'settings_changed'`;
    expect(rows).toHaveLength(1);
    expect(rows[0].metadata).toEqual({ fields: ["email", "frequency"] });
  });
});

describe("countEvents", () => {
  test("returns 0 when no events exist", async () => {
    const count = await countEvents("signup");
    expect(count).toBe(0);
  });

  test("counts events by type", async () => {
    await trackEvent("signup");
    await trackEvent("signup");
    await trackEvent("login");

    expect(await countEvents("signup")).toBe(2);
    expect(await countEvents("login")).toBe(1);
  });

  test("filters by since date", async () => {
    await trackEvent("signup");

    const future = new Date(Date.now() + 60_000);
    expect(await countEvents("signup", future)).toBe(0);

    const past = new Date(Date.now() - 60_000);
    expect(await countEvents("signup", past)).toBe(1);
  });

  test("filters by role", async () => {
    await trackEvent("login", { role: "user" });
    await trackEvent("login", { role: "admin" });
    await trackEvent("login", { role: "user" });

    expect(await countEvents("login", undefined, "user")).toBe(2);
    expect(await countEvents("login", undefined, "admin")).toBe(1);
    expect(await countEvents("login", undefined, "all")).toBe(3);
  });

  test("filters by both since and role", async () => {
    await trackEvent("signup", { role: "user" });
    await trackEvent("signup", { role: "admin" });

    const past = new Date(Date.now() - 60_000);
    expect(await countEvents("signup", past, "user")).toBe(1);
    expect(await countEvents("signup", past, "admin")).toBe(1);

    const future = new Date(Date.now() + 60_000);
    expect(await countEvents("signup", future, "user")).toBe(0);
  });
});

describe("sumEventMetadata", () => {
  test("returns 0 when no events exist", async () => {
    const total = await sumEventMetadata("stars_synced", "count");
    expect(total).toBe(0);
  });

  test("sums a metadata field across events", async () => {
    await trackEvent("stars_synced", { count: 10 });
    await trackEvent("stars_synced", { count: 25 });
    await trackEvent("stars_synced", { count: 5 });

    const total = await sumEventMetadata("stars_synced", "count");
    expect(total).toBe(40);
  });

  test("filters by since date", async () => {
    await trackEvent("stars_synced", { count: 10 });

    const future = new Date(Date.now() + 60_000);
    expect(await sumEventMetadata("stars_synced", "count", future)).toBe(0);

    const past = new Date(Date.now() - 60_000);
    expect(await sumEventMetadata("stars_synced", "count", past)).toBe(10);
  });

  test("filters by role", async () => {
    await trackEvent("stars_synced", { count: 10 }, { role: "user" });
    await trackEvent("stars_synced", { count: 20 }, { role: "admin" });

    expect(
      await sumEventMetadata("stars_synced", "count", undefined, "user"),
    ).toBe(10);
    expect(
      await sumEventMetadata("stars_synced", "count", undefined, "admin"),
    ).toBe(20);
    expect(
      await sumEventMetadata("stars_synced", "count", undefined, "all"),
    ).toBe(30);
  });

  test("filters by both since and role", async () => {
    await trackEvent("stars_synced", { count: 15 }, { role: "user" });
    await trackEvent("stars_synced", { count: 30 }, { role: "admin" });

    const past = new Date(Date.now() - 60_000);
    expect(await sumEventMetadata("stars_synced", "count", past, "user")).toBe(
      15,
    );

    const future = new Date(Date.now() + 60_000);
    expect(
      await sumEventMetadata("stars_synced", "count", future, "admin"),
    ).toBe(0);
  });
});

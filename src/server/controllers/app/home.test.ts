import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { createBunRequest } from "../../test-utils/bun-request";
import { cleanupTestData } from "../../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("../../services/database", () => ({
  get db() {
    return connection;
  },
}));

import { home } from "./home";

describe("Home Controller", () => {
  beforeEach(async () => {
    await cleanupTestData(connection);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  describe("GET /", () => {
    test("renders landing page with all sections", async () => {
      const request = createBunRequest("http://localhost:3000/", {
        method: "GET",
      });
      const response = await home.index(request);
      const html = await response.text();

      expect(response.headers.get("content-type")).toBe("text/html");

      expect(html).toContain("RESURFACE YOUR");
      expect(html).toContain("FORGOTTEN STARS");
      expect(html).toContain("CONNECT GITHUB");

      expect(html).toContain("HOW IT WORKS");
      expect(html).toContain("CONNECT YOUR GITHUB");
      expect(html).toContain("GET 3 REPOS, WEEKLY");
      expect(html).toContain("REVISIT WHAT&#x27;S WORTH KEEPING");

      expect(html).toContain("FULL CONTEXT, NOT JUST LINKS");
      expect(html).toContain("NO NOISE");
      expect(html).toContain("SECURE BY DESIGN.");

      expect(html).toContain("YOUR STARS ARE WAITING");
    });
  });
});

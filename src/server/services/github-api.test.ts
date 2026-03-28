import { afterEach, describe, expect, spyOn, test } from "bun:test";

const mockFetch = spyOn(globalThis, "fetch");

import { fetchAllStarredRepos } from "./github-api";

describe("fetchAllStarredRepos", () => {
  afterEach(() => {
    mockFetch.mockReset();
  });

  test("fetches single page of starred repos", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            starred_at: "2024-01-15T10:00:00Z",
            repo: {
              id: 123,
              full_name: "owner/repo",
              description: "A cool repo",
              language: "TypeScript",
              stargazers_count: 42,
              html_url: "https://github.com/owner/repo",
              pushed_at: "2024-06-01T12:00:00Z",
            },
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    // Empty second page signals end of pagination
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const repos = await fetchAllStarredRepos("test-token");

    expect(repos).toHaveLength(1);
    expect(repos[0].repo_id).toBe(123);
    expect(repos[0].full_name).toBe("owner/repo");
    expect(repos[0].description).toBe("A cool repo");
    expect(repos[0].language).toBe("TypeScript");
    expect(repos[0].stargazers_count).toBe(42);
    expect(repos[0].html_url).toBe("https://github.com/owner/repo");
    expect(repos[0].starred_at).toBe("2024-01-15T10:00:00Z");
    expect(repos[0].last_activity_at).toBe("2024-06-01T12:00:00Z");
  });

  test("paginates through multiple pages", async () => {
    const makePage = (id: number) => ({
      starred_at: "2024-01-01T00:00:00Z",
      repo: {
        id,
        full_name: `owner/repo-${id}`,
        description: null,
        language: null,
        stargazers_count: 1,
        html_url: `https://github.com/owner/repo-${id}`,
        pushed_at: null,
      },
    });

    // Page 1: 100 items (full page → fetch next)
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify(Array.from({ length: 100 }, (_, i) => makePage(i))),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    // Page 2: 1 item (partial page → done)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([makePage(100)]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const repos = await fetchAllStarredRepos("test-token");

    expect(repos).toHaveLength(101);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Verify correct pagination params
    const firstUrl = mockFetch.mock.calls[0][0] as string;
    expect(firstUrl).toContain("page=1");
    expect(firstUrl).toContain("per_page=100");
  });

  test("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));

    await expect(fetchAllStarredRepos("bad-token")).rejects.toThrow(
      "GitHub API error: 403",
    );
  });
});

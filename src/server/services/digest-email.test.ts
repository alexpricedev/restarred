import { describe, expect, test } from "bun:test";
import type { User } from "./auth";
import type { SelectedRepo } from "./digest-email";
import {
  formatRelativeDate,
  formatStarCount,
  generateSubjectLine,
  getActivityStatus,
  renderDigestEmail,
  renderDigestPlainText,
} from "./digest-email";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (ms: number) => new Date(Date.now() - ms);

const makeRepo = (overrides: Partial<SelectedRepo> = {}): SelectedRepo => ({
  starId: "star-1",
  cycle: 1,
  repoId: 1,
  fullName: "owner/repo",
  description: null,
  language: null,
  stargazersCount: 100,
  htmlUrl: "https://github.com/owner/repo",
  starredAt: null,
  lastActivityAt: null,
  isArchived: false,
  ...overrides,
});

describe("formatRelativeDate", () => {
  test("null returns Unknown", () => {
    expect(formatRelativeDate(null)).toBe("Unknown");
  });

  test("less than 1 minute returns just now", () => {
    expect(formatRelativeDate(ago(30 * 1000))).toBe("just now");
  });

  test("exactly 1 minute", () => {
    expect(formatRelativeDate(ago(MINUTE))).toBe("1 minute ago");
  });

  test("multiple minutes", () => {
    expect(formatRelativeDate(ago(45 * MINUTE))).toBe("45 minutes ago");
  });

  test("exactly 1 hour", () => {
    expect(formatRelativeDate(ago(HOUR))).toBe("1 hour ago");
  });

  test("multiple hours", () => {
    expect(formatRelativeDate(ago(5 * HOUR))).toBe("5 hours ago");
  });

  test("exactly 1 day", () => {
    expect(formatRelativeDate(ago(DAY))).toBe("1 day ago");
  });

  test("multiple days", () => {
    expect(formatRelativeDate(ago(4 * DAY))).toBe("4 days ago");
  });

  test("1 week", () => {
    expect(formatRelativeDate(ago(7 * DAY))).toBe("1 week ago");
  });

  test("multiple weeks", () => {
    expect(formatRelativeDate(ago(21 * DAY))).toBe("3 weeks ago");
  });

  test("1 month", () => {
    expect(formatRelativeDate(ago(30 * DAY))).toBe("1 month ago");
  });

  test("multiple months", () => {
    expect(formatRelativeDate(ago(120 * DAY))).toBe("4 months ago");
  });

  test("365+ days returns Mon YYYY format", () => {
    const date = new Date("2024-06-15T00:00:00Z");
    expect(formatRelativeDate(date)).toBe("Jun 2024");
  });

  test("old date returns correct month abbreviation", () => {
    const date = new Date("2020-01-01T00:00:00Z");
    expect(formatRelativeDate(date)).toBe("Jan 2020");
  });
});

describe("getActivityStatus", () => {
  test("null date returns dormant with no recent activity", () => {
    const result = getActivityStatus(null, false);
    expect(result.status).toBe("dormant");
    expect(result.label).toBe("Dormant");
    expect(result.detail).toBe("No recent activity");
    expect(result.badgeColor).toBe("#ababab");
    expect(result.isArchived).toBe(false);
  });

  test("recent activity returns active", () => {
    const result = getActivityStatus(ago(10 * DAY), false);
    expect(result.status).toBe("active");
    expect(result.label).toBe("Active");
    expect(result.badgeColor).toBe("#000000");
    expect(result.detail).toStartWith("Last commit ");
  });

  test("90-364 days returns quiet", () => {
    const result = getActivityStatus(ago(180 * DAY), false);
    expect(result.status).toBe("quiet");
    expect(result.label).toBe("Quiet");
    expect(result.badgeColor).toBe("#5e5e5e");
  });

  test("365+ days returns dormant with detail", () => {
    const result = getActivityStatus(ago(400 * DAY), false);
    expect(result.status).toBe("dormant");
    expect(result.label).toBe("Dormant");
    expect(result.badgeColor).toBe("#ababab");
    expect(result.detail).toStartWith("Last commit ");
  });

  test("isArchived is passed through", () => {
    const result = getActivityStatus(ago(10 * DAY), true);
    expect(result.isArchived).toBe(true);
  });

  test("boundary: just under 90 days is active", () => {
    const result = getActivityStatus(ago(89 * DAY), false);
    expect(result.status).toBe("active");
  });

  test("boundary: exactly 90 days is quiet", () => {
    const result = getActivityStatus(ago(90 * DAY), false);
    expect(result.status).toBe("quiet");
  });

  test("boundary: just under 365 days is quiet", () => {
    const result = getActivityStatus(ago(364 * DAY), false);
    expect(result.status).toBe("quiet");
  });

  test("boundary: exactly 365 days is dormant", () => {
    const result = getActivityStatus(ago(365 * DAY), false);
    expect(result.status).toBe("dormant");
  });
});

describe("formatStarCount", () => {
  test("below 1000 returns plain number", () => {
    expect(formatStarCount(42)).toBe("42");
    expect(formatStarCount(0)).toBe("0");
    expect(formatStarCount(999)).toBe("999");
  });

  test("1000 returns 1k", () => {
    expect(formatStarCount(1000)).toBe("1k");
  });

  test("drops decimal when zero", () => {
    expect(formatStarCount(2000)).toBe("2k");
    expect(formatStarCount(10000)).toBe("10k");
  });

  test("keeps one decimal place", () => {
    expect(formatStarCount(1500)).toBe("1.5k");
    expect(formatStarCount(15200)).toBe("15.2k");
  });

  test("truncates rather than rounds", () => {
    expect(formatStarCount(1990)).toBe("1.9k");
    expect(formatStarCount(1999)).toBe("1.9k");
  });
});

describe("generateSubjectLine", () => {
  test("empty repos returns fallback", () => {
    expect(generateSubjectLine([])).toBe("re:starred — your weekly digest");
  });

  test("single repo uses just the name", () => {
    const repos = [
      makeRepo({ fullName: "facebook/react", stargazersCount: 200000 }),
    ];
    expect(generateSubjectLine(repos)).toBe("re:starred — facebook/react");
  });

  test("two repos uses singular other", () => {
    const repos = [
      makeRepo({ fullName: "facebook/react", stargazersCount: 200000 }),
      makeRepo({ fullName: "vuejs/vue", stargazersCount: 190000 }),
    ];
    expect(generateSubjectLine(repos)).toBe(
      "re:starred — facebook/react and 1 other",
    );
  });

  test("three repos uses plural others", () => {
    const repos = [
      makeRepo({ fullName: "facebook/react", stargazersCount: 200000 }),
      makeRepo({ fullName: "vuejs/vue", stargazersCount: 190000 }),
      makeRepo({ fullName: "angular/angular", stargazersCount: 80000 }),
    ];
    expect(generateSubjectLine(repos)).toBe(
      "re:starred — facebook/react and 2 others",
    );
  });

  test("picks repo with highest star count", () => {
    const repos = [
      makeRepo({ fullName: "small/lib", stargazersCount: 100 }),
      makeRepo({ fullName: "big/framework", stargazersCount: 50000 }),
      makeRepo({ fullName: "medium/tool", stargazersCount: 5000 }),
    ];
    expect(generateSubjectLine(repos)).toBe(
      "re:starred — big/framework and 2 others",
    );
  });
});

const mockUser: User = {
  id: "user-1",
  github_id: 12345,
  github_username: "testuser",
  github_email: "test@example.com",
  email_override: null,
  github_token: "encrypted-token",
  digest_day: 1,
  digest_hour: 9,
  timezone: "America/New_York",
  is_active: true,
  filter_own_repos: true,
  has_viewed_first: false,
  role: "user",
  sync_status: "done",
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

describe("renderDigestPlainText", () => {
  test("contains all repo details", () => {
    const repos = [
      makeRepo({
        fullName: "owner/test-repo",
        description: "A test repository",
        language: "TypeScript",
        stargazersCount: 1500,
        htmlUrl: "https://github.com/owner/test-repo",
        lastActivityAt: ago(14 * DAY),
      }),
    ];
    const text = renderDigestPlainText(
      repos,
      "http://localhost:3000/account",
      "http://localhost:3000/unsubscribe?token=abc",
    );

    expect(text).toContain("owner/test-repo");
    expect(text).toContain("A test repository");
    expect(text).toContain("TypeScript");
    expect(text).toContain("1.5k");
    expect(text).toContain("https://github.com/owner/test-repo");
    expect(text).toContain("Active");
  });

  test("contains footer links", () => {
    const repos = [makeRepo()];
    const text = renderDigestPlainText(
      repos,
      "http://localhost:3000/account",
      "http://localhost:3000/unsubscribe?token=abc",
    );

    expect(text).toContain("Manage preferences: http://localhost:3000/account");
    expect(text).toContain(
      "Unsubscribe: http://localhost:3000/unsubscribe?token=abc",
    );
  });

  test("handles null description", () => {
    const repos = [makeRepo({ description: null })];
    const text = renderDigestPlainText(repos, "http://x", "http://y");

    expect(text).not.toContain("null");
  });

  test("handles null language", () => {
    const repos = [makeRepo({ language: null })];
    const text = renderDigestPlainText(repos, "http://x", "http://y");

    expect(text).not.toContain("null");
  });
});

describe("renderDigestEmail", () => {
  const repos = [
    makeRepo({
      starId: "star-1",
      fullName: "owner/test-repo",
      description: "A test repository",
      language: "TypeScript",
      stargazersCount: 1500,
      htmlUrl: "https://github.com/owner/test-repo",
      lastActivityAt: ago(14 * DAY),
    }),
    makeRepo({
      starId: "star-2",
      fullName: "org/another-repo",
      description: "Another repo",
      language: "Rust",
      stargazersCount: 5000,
      htmlUrl: "https://github.com/org/another-repo",
      lastActivityAt: ago(30 * DAY),
    }),
  ];

  test("returns subject, html, and text", () => {
    const result = renderDigestEmail(mockUser, repos, "token-123");
    expect(result.subject).toBeDefined();
    expect(result.html).toBeDefined();
    expect(result.text).toBeDefined();
  });

  test("subject contains re:starred and top repo name", () => {
    const result = renderDigestEmail(mockUser, repos, "token-123");
    expect(result.subject).toContain("re:starred");
    expect(result.subject).toContain("another-repo");
  });

  test("html contains DOCTYPE and key content", () => {
    const result = renderDigestEmail(mockUser, repos, "token-123");
    expect(result.html).toStartWith("<!DOCTYPE html>");
    expect(result.html).toContain("owner/test-repo");
    expect(result.html).toContain("org/another-repo");
    expect(result.html).toContain("re:starred");
    expect(result.html).toContain("Your weekly digest");
    expect(result.html).toContain("Manage your digest");
    expect(result.html).toContain("Unsubscribe");
  });

  test("text contains repo details", () => {
    const result = renderDigestEmail(mockUser, repos, "token-123");
    expect(result.text).toContain("owner/test-repo");
    expect(result.text).toContain("org/another-repo");
  });

  test("unsubscribe URL includes the token", () => {
    const result = renderDigestEmail(mockUser, repos, "token-123");
    expect(result.html).toContain("unsubscribe?token=token-123");
    expect(result.text).toContain("unsubscribe?token=token-123");
  });

  test("account URL is present", () => {
    const result = renderDigestEmail(mockUser, repos, "token-123");
    expect(result.html).toContain("/account");
    expect(result.text).toContain("/account");
  });
});

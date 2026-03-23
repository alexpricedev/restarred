import { renderToString } from "react-dom/server";
import { DigestEmail } from "../components/email/digest-email";
import type { SelectedRepo } from "./digest";
import type { User } from "./users";

export type { SelectedRepo };

export type ActivityStatus = "active" | "quiet" | "dormant";

export interface RepoActivity {
  status: ActivityStatus;
  isArchived: boolean;
  label: string;
  detail: string;
  badgeColor: string;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatRelativeDate = (date: Date | null): string => {
  if (date === null) return "Unknown";

  const diff = Date.now() - date.getTime();

  if (diff < MINUTE) return "just now";

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  if (diff < 30 * DAY) {
    const weeks = Math.floor(diff / (7 * DAY));
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  if (diff < 365 * DAY) {
    const months = Math.floor(diff / (30 * DAY));
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export const getActivityStatus = (
  lastActivityAt: Date | null,
  isArchived: boolean,
): RepoActivity => {
  if (lastActivityAt === null) {
    return {
      status: "dormant",
      isArchived,
      label: "Dormant",
      detail: "No recent activity",
      badgeColor: "#ababab",
    };
  }

  const diff = Date.now() - lastActivityAt.getTime();
  const detail = `Last commit ${formatRelativeDate(lastActivityAt)}`;

  if (diff < 90 * DAY) {
    return {
      status: "active",
      isArchived,
      label: "Active",
      detail,
      badgeColor: "#000000",
    };
  }

  if (diff < 365 * DAY) {
    return {
      status: "quiet",
      isArchived,
      label: "Quiet",
      detail,
      badgeColor: "#5e5e5e",
    };
  }

  return {
    status: "dormant",
    isArchived,
    label: "Dormant",
    detail,
    badgeColor: "#ababab",
  };
};

export const formatStarCount = (count: number): string => {
  if (count < 1000) return String(count);

  const k = count / 1000;
  const rounded = Math.floor(k * 10) / 10;
  return rounded === Math.floor(rounded)
    ? `${Math.floor(rounded)}k`
    : `${rounded}k`;
};

export const generateSubjectLine = (repos: SelectedRepo[]): string => {
  if (repos.length === 0)
    throw new Error("Cannot generate subject for empty repos");

  const top = repos.reduce((best, repo) =>
    repo.stargazersCount > best.stargazersCount ? repo : best,
  );

  const stars = `★ ${formatStarCount(top.stargazersCount)}`;

  if (repos.length === 1) return `${top.fullName} — ${stars}`;
  if (repos.length === 2)
    return `${top.fullName} and 1 other — from your stars`;
  return `${top.fullName} and ${repos.length - 1} others — from your stars`;
};

export const renderDigestPlainText = (
  displayName: string,
  repos: SelectedRepo[],
  accountUrl: string,
  unsubscribeUrl: string,
): string => {
  const lines: string[] = [
    `${repos.length} repos from your stars`,
    "",
    `Hi ${displayName}, here are ${repos.length} repos from your stars worth revisiting.`,
    "",
  ];

  repos.forEach((repo, i) => {
    lines.push(`${i + 1}. ${repo.fullName}`);
    if (repo.description) {
      lines.push(`   ${repo.description}`);
    }

    const activity = getActivityStatus(repo.lastActivityAt, repo.isArchived);
    const parts = [`★ ${formatStarCount(repo.stargazersCount)}`];
    if (repo.language) {
      parts.push(repo.language);
    }
    parts.push(activity.label);
    lines.push(`   ${parts.join(" · ")}`);
    lines.push(`   ${repo.htmlUrl}`);
    lines.push("");
  });

  lines.push("---");
  lines.push(`Manage preferences: ${accountUrl}`);
  lines.push(`Unsubscribe: ${unsubscribeUrl}`);
  lines.push("Privacy Policy: https://restarred.dev/privacy");
  lines.push("");
  lines.push("INFINITE CHAPTERS LTD");
  lines.push(
    "Electric Works Digital Campus, 3 Concourse Way, Sheffield, S1 2BJ, United Kingdom",
  );

  return lines.join("\n");
};

const APP_URL = process.env.APP_URL as string;

export const renderDigestEmail = (
  user: User,
  repos: SelectedRepo[],
  unsubscribeToken: string,
): {
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
} => {
  const accountUrl = `${APP_URL}/account`;
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;
  const displayName = user.github_name || user.github_username;

  const subject = generateSubjectLine(repos);
  const html = `<!DOCTYPE html>${renderToString(<DigestEmail displayName={displayName} repos={repos} accountUrl={accountUrl} unsubscribeUrl={unsubscribeUrl} />)}`;
  const text = renderDigestPlainText(
    displayName,
    repos,
    accountUrl,
    unsubscribeUrl,
  );

  const headers = {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  return { subject, html, text, headers };
};

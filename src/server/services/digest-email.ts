import type { SelectedRepo } from "./digest";

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
  if (repos.length === 0) return "re:starred — your weekly digest";

  const top = repos.reduce((best, repo) =>
    repo.stargazersCount > best.stargazersCount ? repo : best,
  );
  const name = top.fullName.split("/").pop() as string;

  if (repos.length === 1) return `re:starred — ${name}`;
  if (repos.length === 2) return `re:starred — ${name} and 1 other`;
  return `re:starred — ${name} and ${repos.length - 1} others`;
};

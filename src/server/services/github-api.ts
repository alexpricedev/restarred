import { httpFetch } from "../utils/http";
import { log, maskEmail } from "./logger";

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
}

export const exchangeCodeForToken = async (code: string): Promise<string> => {
  const response = await httpFetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
  };
  if (data.error || !data.access_token) {
    throw new Error(data.error ?? "Failed to exchange code for token");
  }
  return data.access_token;
};

export const fetchGitHubUser = async (
  accessToken: string,
): Promise<GitHubUserProfile> => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github.v3+json",
  };

  const response = await httpFetch(GITHUB_USER_URL, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const profile = (await response.json()) as GitHubUserProfile;

  if (!profile.email) {
    log.info("github", "Profile email null, fetching from /user/emails");
    profile.email = await fetchPrimaryEmail(accessToken);
  }

  log.info(
    "github",
    `Resolved email: ${profile.email ? maskEmail(profile.email) : "(none)"}`,
  );
  return profile;
};

const fetchPrimaryEmail = async (
  accessToken: string,
): Promise<string | null> => {
  const response = await httpFetch(`${GITHUB_USER_URL}/emails`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) return null;

  const emails = (await response.json()) as Array<{
    email: string;
    primary: boolean;
    verified: boolean;
  }>;

  const primary = emails.find((e) => e.primary && e.verified);
  return primary?.email ?? emails[0]?.email ?? null;
};

export const revokeGitHubGrant = async (
  accessToken: string,
): Promise<boolean> => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    log.warn("github", "Missing OAuth credentials, skipping grant revocation");
    return false;
  }

  const response = await httpFetch(
    `https://api.github.com/applications/${clientId}/grant`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: accessToken }),
    },
  );

  if (response.status === 204) {
    log.info("github", "OAuth grant revoked successfully");
    return true;
  }

  log.warn("github", `Grant revocation returned status ${response.status}`);
  return false;
};

export interface StarredRepo {
  repo_id: number;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  starred_at: string | null;
  last_activity_at: string | null;
}

interface GitHubStarredResponse {
  starred_at: string;
  repo: {
    id: number;
    full_name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    html_url: string;
    pushed_at: string | null;
  };
}

export const fetchAllStarredRepos = async (
  accessToken: string,
): Promise<StarredRepo[]> => {
  const allRepos: StarredRepo[] = [];
  let page = 1;

  while (true) {
    const response = await httpFetch(
      `https://api.github.com/user/starred?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.star+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const items = (await response.json()) as GitHubStarredResponse[];
    if (items.length === 0) break;

    for (const item of items) {
      allRepos.push({
        repo_id: item.repo.id,
        full_name: item.repo.full_name,
        description: item.repo.description,
        language: item.repo.language,
        stargazers_count: item.repo.stargazers_count,
        html_url: item.repo.html_url,
        starred_at: item.starred_at,
        last_activity_at: item.repo.pushed_at,
      });
    }

    if (items.length < 100) break;
    page++;
  }

  return allRepos;
};

export const unstarRepo = async (
  accessToken: string,
  fullName: string,
): Promise<boolean> => {
  const response = await httpFetch(
    `https://api.github.com/user/starred/${fullName}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (response.status === 204 || response.status === 404) {
    return true;
  }

  log.warn("github", `Unstar ${fullName} returned status ${response.status}`);
  return false;
};

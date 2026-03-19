const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

export interface GitHubUserProfile {
  id: number;
  login: string;
  email: string | null;
}

export const exchangeCodeForToken = async (code: string): Promise<string> => {
  const response = await fetch(GITHUB_TOKEN_URL, {
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

  const response = await fetch(GITHUB_USER_URL, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const profile = (await response.json()) as GitHubUserProfile;

  if (!profile.email) {
    profile.email = await fetchPrimaryEmail(accessToken);
  }

  return profile;
};

const fetchPrimaryEmail = async (
  accessToken: string,
): Promise<string | null> => {
  const response = await fetch(`${GITHUB_USER_URL}/emails`, {
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

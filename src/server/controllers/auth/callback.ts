import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { findOrCreateGitHubUser } from "../../services/auth";
import { encrypt } from "../../services/encryption";
import { log } from "../../services/logger";
import {
  createAuthenticatedSession,
  deleteSession,
  setSessionCookie,
} from "../../services/sessions";
import { redirect } from "../../utils/response";

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

function getStateCookie(req: BunRequest): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/github_oauth_state=([^;]+)/);
  return match ? match[1] : null;
}

function clearStateCookie(): string {
  return "github_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
}

async function exchangeCodeForToken(code: string): Promise<string> {
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
}

async function fetchGitHubUser(
  accessToken: string,
): Promise<{ id: number; login: string; email: string | null }> {
  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json() as Promise<{
    id: number;
    login: string;
    email: string | null;
  }>;
}

export const callback = {
  async index(req: BunRequest): Promise<Response> {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getStateCookie(req);

    if (!code || !state) {
      return redirect("/login?error=Missing OAuth parameters");
    }

    if (!storedState || state !== storedState) {
      const res = redirect(
        "/login?error=Invalid OAuth state. Please try again.",
      );
      res.headers.append("Set-Cookie", clearStateCookie());
      return res;
    }

    try {
      const accessToken = await exchangeCodeForToken(code);
      const githubUser = await fetchGitHubUser(accessToken);
      const encryptedToken = encrypt(accessToken);

      const user = await findOrCreateGitHubUser({
        githubId: githubUser.id,
        githubUsername: githubUser.login,
        githubEmail: githubUser.email ?? "",
        encryptedToken,
      });

      const ctx = await getSessionContext(req);
      if (ctx.isGuest && ctx.sessionId) {
        await deleteSession(ctx.sessionId);
      }

      const sessionId = await createAuthenticatedSession(user.id);

      const response = new Response("", {
        status: 303,
        headers: { Location: "/" },
      });

      setSessionCookie(req, sessionId);
      response.headers.append("Set-Cookie", clearStateCookie());

      return response;
    } catch (error) {
      log.error("auth", `GitHub OAuth callback failed: ${error}`);
      const res = redirect(
        "/login?error=Authentication failed. Please try again.",
      );
      res.headers.append("Set-Cookie", clearStateCookie());
      return res;
    }
  },
};

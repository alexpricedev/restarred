import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { findOrCreateGitHubUser } from "../../services/auth";
import { encrypt } from "../../services/encryption";
import {
  exchangeCodeForToken,
  fetchGitHubUser,
} from "../../services/github-api";
import { log } from "../../services/logger";
import {
  createAuthenticatedSession,
  deleteSession,
  setSessionCookie,
} from "../../services/sessions";
import { syncUserStars } from "../../services/stars";
import { redirect } from "../../utils/response";

function getStateCookie(req: BunRequest): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/github_oauth_state=([^;]+)/);
  return match ? match[1] : null;
}

function clearStateCookie(): string {
  return `github_oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export const callback = {
  async index(req: BunRequest): Promise<Response> {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getStateCookie(req);

    if (!code || !state) {
      return redirect("/?error=missing_params");
    }

    if (!storedState || state !== storedState) {
      const res = redirect("/?error=state_mismatch");
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

      const isNewUser = user.sync_status === "idle";

      if (isNewUser) {
        syncUserStars(user.id, accessToken).catch((err) => {
          log.error(
            "stars",
            `Background sync failed for user ${user.id}: ${err}`,
          );
        });
      }

      const response = new Response("", {
        status: 303,
        headers: { Location: isNewUser ? "/welcome" : "/" },
      });

      setSessionCookie(req, sessionId);
      response.headers.append("Set-Cookie", clearStateCookie());

      return response;
    } catch (error) {
      log.error("auth", `GitHub OAuth callback failed: ${error}`);
      const res = redirect("/?error=auth_failed");
      res.headers.append("Set-Cookie", clearStateCookie());
      return res;
    }
  },
};

import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { decrypt } from "../../services/encryption";
import { trackEvent } from "../../services/events";
import { revokeGitHubGrant } from "../../services/github-api";
import { log } from "../../services/logger";
import { clearSessionCookie, setSessionCookie } from "../../services/sessions";
import { deleteUser } from "../../services/users";
import { DeleteAccount } from "../../templates/delete-account";
import { setFlashCookie } from "../../utils/flash";
import { redirect, render } from "../../utils/response";

async function handleGet(req: BunRequest): Promise<Response> {
  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  if (ctx.requiresSetCookie) {
    setSessionCookie(req, ctx.sessionId);
  }

  const csrfToken = await createCsrfToken(
    ctx.sessionId,
    "POST",
    "/account/delete",
  );
  const logoutCsrfToken = await createCsrfToken(
    ctx.sessionId,
    "POST",
    "/auth/logout",
  );

  return render(
    <DeleteAccount
      user={ctx.user}
      csrfToken={csrfToken}
      logoutCsrfToken={logoutCsrfToken}
    />,
  );
}

async function handlePost(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, { path: "/account/delete" });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  try {
    try {
      const token = decrypt(ctx.user.github_token);
      await revokeGitHubGrant(token);
    } catch (revokeError) {
      log.warn(
        "account",
        `Failed to revoke GitHub grant: ${revokeError instanceof Error ? revokeError.message : "Unknown error"}`,
      );
    }

    await deleteUser(ctx.user.id);
    clearSessionCookie(req);
    trackEvent("account_deletion", { role: ctx.user.role }).catch((err) => {
      log.warn("events", `Failed to track account_deletion: ${err}`);
    });

    log.info("account", `Account deleted for user ${ctx.user.github_username}`);

    setFlashCookie(req, "home", {
      type: "success",
      message: "Your account has been deleted.",
    });

    return redirect("/");
  } catch (error) {
    log.error(
      "account",
      `Failed to delete account: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return redirect("/account");
  }
}

export const deleteAccount = {
  index: handleGet,
  destroy: handlePost,
};

import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { selectReposForDigest } from "../../services/digest";
import { renderDigestEmail } from "../../services/digest-email";
import { getEmailService } from "../../services/email";
import { log } from "../../services/logger";
import { setSessionCookie } from "../../services/sessions";
import { getStarCount } from "../../services/stars";
import { markFirstViewed } from "../../services/users";
import { First } from "../../templates/first";
import { redirect, render } from "../../utils/response";

async function handleGet(req: BunRequest): Promise<Response> {
  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  if (ctx.user.sync_status !== "done") {
    return redirect("/welcome");
  }

  if (ctx.user.has_viewed_first) {
    return redirect("/account");
  }

  if (ctx.requiresSetCookie) {
    setSessionCookie(req, ctx.sessionId);
  }

  const starCount = await getStarCount(ctx.user.id);
  const sendCsrfToken = await createCsrfToken(
    ctx.sessionId,
    "POST",
    "/first/send",
  );
  const skipCsrfToken = await createCsrfToken(
    ctx.sessionId,
    "POST",
    "/first/skip",
  );

  return render(
    <First
      user={ctx.user}
      starCount={starCount}
      sendCsrfToken={sendCsrfToken}
      skipCsrfToken={skipCsrfToken}
    />,
  );
}

async function handleSend(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, { path: "/first/send" });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  try {
    const repos = await selectReposForDigest({
      userId: ctx.user.id,
      excludeOwner: ctx.user.filter_own_repos
        ? ctx.user.github_username
        : undefined,
    });
    const email = renderDigestEmail(ctx.user, repos, "first");
    const recipientEmail = ctx.user.email_override || ctx.user.github_email;

    await getEmailService().send({
      to: { email: recipientEmail, name: ctx.user.github_username },
      from: {
        email: process.env.FROM_EMAIL as string,
        name: process.env.FROM_NAME as string,
      },
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    log.info("first", `First digest sent to ${recipientEmail}`);
  } catch (error) {
    log.error(
      "first",
      `Failed to send first digest: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  await markFirstViewed(ctx.user.id);
  return redirect("/account");
}

async function handleSkip(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, { path: "/first/skip" });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  await markFirstViewed(ctx.user.id);
  log.info("first", `User ${ctx.user.id} skipped first digest`);
  return redirect("/account");
}

export const first = {
  index: handleGet,
  send: handleSend,
  skip: handleSkip,
};

import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import {
  recordDigestSelections,
  selectReposForDigest,
} from "../../services/digest";
import { renderDigestEmail } from "../../services/digest-email";
import { getEmailService } from "../../services/email";
import { trackEvent } from "../../services/events";
import { log, maskEmail } from "../../services/logger";
import { setSessionCookie } from "../../services/sessions";
import { getStarCount } from "../../services/stars";
import { generateUnsubscribeToken } from "../../services/unsubscribe";
import { recordConsent } from "../../services/users";
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

  if (ctx.user.consented_to_emails) {
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

async function renderFirstWithError(
  sessionId: string,
  user: Parameters<typeof First>[0]["user"],
  error: string,
): Promise<Response> {
  const starCount = await getStarCount(user.id);
  const sendCsrfToken = await createCsrfToken(sessionId, "POST", "/first/send");
  const skipCsrfToken = await createCsrfToken(sessionId, "POST", "/first/skip");
  return render(
    <First
      user={user}
      starCount={starCount}
      sendCsrfToken={sendCsrfToken}
      skipCsrfToken={skipCsrfToken}
      error={error}
    />,
  );
}

function getConsentContext(req: BunRequest) {
  return {
    ipAddress: req.headers.get("x-forwarded-for") || null,
    userAgent: req.headers.get("user-agent") || null,
  };
}

async function handleSend(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, { path: "/first/send" });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  const formData = await req.formData();
  const consent = formData.get("consent");

  if (!consent) {
    return renderFirstWithError(
      ctx.sessionId,
      ctx.user,
      "You must agree to receive emails and accept the terms to continue.",
    );
  }

  try {
    const repos = await selectReposForDigest({
      userId: ctx.user.id,
      excludeOwner: ctx.user.filter_own_repos
        ? ctx.user.github_username
        : undefined,
    });
    const unsubscribeToken = generateUnsubscribeToken(ctx.user.id);
    const email = renderDigestEmail(ctx.user, repos, unsubscribeToken);
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
      headers: email.headers,
    });

    await recordDigestSelections(
      ctx.user.id,
      repos.map((r) => ({ starId: r.starId, cycle: r.cycle })),
    );

    trackEvent("digest_sent", { role: ctx.user.role }).catch((err) => {
      log.warn("events", `Failed to track digest_sent: ${err}`);
    });

    log.info("first", `First digest sent to ${maskEmail(recipientEmail)}`);
  } catch (error) {
    log.error(
      "first",
      `Failed to send first digest: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  await recordConsent(ctx.user.id, getConsentContext(req));
  return redirect("/account");
}

async function handleSkip(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, { path: "/first/skip" });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  const formData = await req.formData();
  const consent = formData.get("consent");

  if (!consent) {
    return renderFirstWithError(
      ctx.sessionId,
      ctx.user,
      "You must agree to receive emails and accept the terms to continue.",
    );
  }

  await recordConsent(ctx.user.id, getConsentContext(req));
  log.info("first", `User ${ctx.user.id} skipped first digest`);
  return redirect("/account");
}

export const first = {
  index: handleGet,
  send: handleSend,
  skip: handleSkip,
};

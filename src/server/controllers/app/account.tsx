import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { getDigestCount, selectReposForDigest } from "../../services/digest";
import { renderDigestEmail } from "../../services/digest-email";
import { getEmailService } from "../../services/email";
import { trackEvent } from "../../services/events";
import { log } from "../../services/logger";
import { setSessionCookie } from "../../services/sessions";
import { getStarCount } from "../../services/stars";
import { generateUnsubscribeToken } from "../../services/unsubscribe";
import type { User } from "../../services/users";
import { updateUserPreferences } from "../../services/users";
import { Account } from "../../templates/account";
import { getFlashCookie, setFlashCookie } from "../../utils/flash";
import { redirect, render } from "../../utils/response";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function renderAccountPage(
  user: User,
  sessionId: string,
  flash?: { type: "success" | "error"; message: string },
): Promise<Response> {
  const [starCount, digestCount] = await Promise.all([
    getStarCount(user.id),
    getDigestCount(user.id),
  ]);
  const csrfToken = await createCsrfToken(sessionId, "POST", "/account");
  const logoutCsrfToken = await createCsrfToken(
    sessionId,
    "POST",
    "/auth/logout",
  );
  const testEmailCsrfToken =
    user.role === "admin"
      ? await createCsrfToken(sessionId, "POST", "/account/test-email")
      : undefined;

  return render(
    <Account
      user={user}
      starCount={starCount}
      digestCount={digestCount}
      csrfToken={csrfToken}
      logoutCsrfToken={logoutCsrfToken}
      testEmailCsrfToken={testEmailCsrfToken}
      flash={flash}
    />,
  );
}

async function handleGet(req: BunRequest): Promise<Response> {
  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  if (ctx.requiresSetCookie) {
    setSessionCookie(req, ctx.sessionId);
  }

  trackEvent("account_view", { role: ctx.user.role }).catch((err) => {
    log.warn("events", `Failed to track account_view: ${err}`);
  });

  const flash = getFlashCookie<{ type: "success" | "error"; message: string }>(
    req,
    "account",
  );
  const flashMessage = flash.type ? flash : undefined;

  return renderAccountPage(ctx.user, ctx.sessionId, flashMessage);
}

async function handlePost(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, { path: "/account" });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  try {
    const formData = await req.formData();

    const emailOverride = (formData.get("email_override") as string) ?? "";
    const digestDayRaw = formData.get("digest_day") as string;
    const digestHourRaw = formData.get("digest_hour") as string;
    const timezone = (formData.get("timezone") as string) ?? "";
    const isActiveRaw = formData.get("is_active") as string;
    const filterOwnReposRaw = formData.get("filter_own_repos") as string;

    if (emailOverride && !EMAIL_REGEX.test(emailOverride)) {
      return renderAccountPage(ctx.user, ctx.sessionId, {
        type: "error",
        message: "Please enter a valid email address.",
      });
    }

    if (emailOverride && emailOverride.length > 254) {
      return renderAccountPage(ctx.user, ctx.sessionId, {
        type: "error",
        message: "Email address is too long.",
      });
    }

    const digestDay = Number.parseInt(digestDayRaw, 10);
    if (Number.isNaN(digestDay) || digestDay < 0 || digestDay > 6) {
      return renderAccountPage(ctx.user, ctx.sessionId, {
        type: "error",
        message: "Please select a valid day.",
      });
    }

    const digestHour = Number.parseInt(digestHourRaw, 10);
    if (Number.isNaN(digestHour) || digestHour < 0 || digestHour > 23) {
      return renderAccountPage(ctx.user, ctx.sessionId, {
        type: "error",
        message: "Please select a valid time.",
      });
    }

    if (!timezone) {
      return renderAccountPage(ctx.user, ctx.sessionId, {
        type: "error",
        message: "Please select a timezone.",
      });
    }

    const isActive = isActiveRaw === "true";
    const filterOwnRepos = filterOwnReposRaw !== "false";

    await updateUserPreferences(ctx.user.id, {
      emailOverride,
      digestDay,
      digestHour,
      timezone,
      isActive,
      filterOwnRepos,
    });

    const wasReactivated = isActive && !ctx.user.is_active;
    const wasPaused = !isActive && ctx.user.is_active;

    const changedFields: string[] = [];
    if (emailOverride !== (ctx.user.email_override ?? ""))
      changedFields.push("email_override");
    if (digestDay !== ctx.user.digest_day) changedFields.push("digest_day");
    if (digestHour !== ctx.user.digest_hour) changedFields.push("digest_hour");
    if (timezone !== ctx.user.timezone) changedFields.push("timezone");
    if (isActive !== ctx.user.is_active) changedFields.push("is_active");
    if (filterOwnRepos !== ctx.user.filter_own_repos)
      changedFields.push("filter_own_repos");

    if (changedFields.length > 0) {
      trackEvent(
        "settings_changed",
        { fields: changedFields },
        { role: ctx.user.role },
      ).catch((err) => {
        log.warn("events", `Failed to track settings_changed: ${err}`);
      });
    }

    if (wasReactivated) {
      trackEvent("resubscribe", { role: ctx.user.role }).catch((err) => {
        log.warn("events", `Failed to track resubscribe: ${err}`);
      });
    } else if (wasPaused) {
      trackEvent("unsubscribe", { role: ctx.user.role }).catch((err) => {
        log.warn("events", `Failed to track unsubscribe: ${err}`);
      });
    }

    log.info("account", `Preferences updated for user ${ctx.user.id}`);

    if (!wasPaused) {
      setFlashCookie(req, "account", {
        type: "success",
        message: wasReactivated
          ? "Your digest has been reactivated."
          : "Preferences saved.",
      });
    }

    return redirect("/account");
  } catch (error) {
    log.error(
      "account",
      `Failed to update preferences: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    return renderAccountPage(ctx.user, ctx.sessionId, {
      type: "error",
      message: "Something went wrong. Please try again.",
    });
  }
}

async function handleTestEmail(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, {
    path: "/account/test-email",
  });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  if (ctx.user.role !== "admin") {
    return redirect("/account");
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

    log.info("account", `Test email sent to ${recipientEmail}`);

    setFlashCookie(req, "account", {
      type: "success",
      message: `Test email sent to ${recipientEmail}.`,
    });
  } catch (error) {
    log.error(
      "account",
      `Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    setFlashCookie(req, "account", {
      type: "error",
      message: "Failed to send test email. Please try again.",
    });
  }

  return redirect("/account");
}

export const account = {
  index: handleGet,
  update: handlePost,
  testEmail: handleTestEmail,
};

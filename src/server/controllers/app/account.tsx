import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { getDigestCount, selectReposForDigest } from "../../services/digest";
import { renderDigestEmail } from "../../services/digest-email";
import { getEmailService } from "../../services/email";
import {
  cancelPendingVerification,
  createVerification,
  getPendingVerification,
  RateLimitError,
  verifyPin,
} from "../../services/email-verification";
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
  emailFlash?: { type: "success" | "error"; message: string },
): Promise<Response> {
  const [starCount, digestCount, pendingVerification] = await Promise.all([
    getStarCount(user.id),
    getDigestCount(user.id),
    getPendingVerification(user.id),
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
  const resendCsrfToken = pendingVerification
    ? await createCsrfToken(sessionId, "POST", "/account/resend-verification")
    : undefined;
  const verifyPinCsrfToken = pendingVerification
    ? await createCsrfToken(sessionId, "POST", "/account/verify-pin")
    : undefined;
  const cancelVerificationCsrfToken = pendingVerification
    ? await createCsrfToken(sessionId, "POST", "/account/cancel-verification")
    : undefined;

  return render(
    <Account
      user={user}
      starCount={starCount}
      digestCount={digestCount}
      csrfToken={csrfToken}
      logoutCsrfToken={logoutCsrfToken}
      testEmailCsrfToken={testEmailCsrfToken}
      resendCsrfToken={resendCsrfToken}
      verifyPinCsrfToken={verifyPinCsrfToken}
      cancelVerificationCsrfToken={cancelVerificationCsrfToken}
      pendingEmail={pendingVerification?.email}
      flash={flash}
      emailFlash={emailFlash}
    />,
  );
}

async function handleGet(req: BunRequest): Promise<Response> {
  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  if (!ctx.user.consented_to_emails) {
    return redirect("/first");
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
  const emailFlash = getFlashCookie<{
    type: "success" | "error";
    message: string;
  }>(req, "account-email");
  const flashMessage = flash.type ? flash : undefined;
  const emailFlashMessage = emailFlash.type ? emailFlash : undefined;

  return renderAccountPage(
    ctx.user,
    ctx.sessionId,
    flashMessage,
    emailFlashMessage,
  );
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

    const currentOverride = ctx.user.email_override ?? "";
    const emailChanged = emailOverride !== currentOverride;
    const emailCleared = emailChanged && !emailOverride;
    const emailRequiresVerification = emailChanged && !!emailOverride;

    if (emailCleared) {
      await cancelPendingVerification(ctx.user.id);
    }

    await updateUserPreferences(ctx.user.id, {
      emailOverride: emailRequiresVerification
        ? currentOverride
        : emailOverride,
      digestDay,
      digestHour,
      timezone,
      isActive,
      filterOwnRepos,
    });

    if (emailRequiresVerification) {
      try {
        await createVerification(ctx.user.id, emailOverride);
      } catch (error) {
        if (error instanceof RateLimitError) {
          setFlashCookie(req, "account-email", {
            type: "error",
            message:
              "Please wait a few minutes before requesting another verification email.",
          });
          return redirect("/account#delivery-email");
        }
        throw error;
      }
    }

    const wasReactivated = isActive && !ctx.user.is_active;
    const wasPaused = !isActive && ctx.user.is_active;

    const changedFields: string[] = [];
    if (emailChanged) changedFields.push("email_override");
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

    if (emailRequiresVerification) {
      setFlashCookie(req, "account-email", {
        type: "success",
        message: `Verification email sent to ${emailOverride}. Please check your inbox.`,
      });
      return redirect("/account#delivery-email");
    }
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

async function handleResendVerification(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, {
    path: "/account/resend-verification",
  });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  try {
    const pending = await getPendingVerification(ctx.user.id);

    if (!pending) {
      setFlashCookie(req, "account-email", {
        type: "error",
        message: "No pending verification to resend.",
      });
      return redirect("/account#delivery-email");
    }

    await createVerification(ctx.user.id, pending.email);

    setFlashCookie(req, "account-email", {
      type: "success",
      message: `Verification email resent to ${pending.email}.`,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      setFlashCookie(req, "account-email", {
        type: "error",
        message:
          "Please wait a few minutes before requesting another verification email.",
      });
    } else {
      log.error(
        "account",
        `Failed to resend verification: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setFlashCookie(req, "account-email", {
        type: "error",
        message: "Failed to resend verification email. Please try again.",
      });
    }
  }

  return redirect("/account#delivery-email");
}

async function handleVerifyPin(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, {
    path: "/account/verify-pin",
  });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  try {
    const formData = await req.formData();
    const pin = (formData.get("pin") as string) ?? "";

    const result = await verifyPin(pin);

    if (result.success) {
      setFlashCookie(req, "account-email", {
        type: "success",
        message: `Email verified! Your digest will now be delivered to ${result.email}.`,
      });
    } else {
      setFlashCookie(req, "account-email", {
        type: "error",
        message:
          result.reason === "expired"
            ? "Code expired. Please request a new one."
            : "Invalid code. Please try again.",
      });
    }
  } catch (error) {
    log.error(
      "account",
      `PIN verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    setFlashCookie(req, "account-email", {
      type: "error",
      message: "Something went wrong. Please try again.",
    });
  }

  return redirect("/account#delivery-email");
}

async function handleCancelVerification(req: BunRequest): Promise<Response> {
  const csrfError = await csrfProtection(req, {
    path: "/account/cancel-verification",
  });
  if (csrfError) return csrfError;

  const ctx = await getSessionContext(req);

  if (!ctx.isAuthenticated || !ctx.user || !ctx.sessionId) {
    return redirect("/");
  }

  await cancelPendingVerification(ctx.user.id);

  setFlashCookie(req, "account-email", {
    type: "success",
    message: "Verification cancelled.",
  });

  return redirect("/account#delivery-email");
}

export const account = {
  index: handleGet,
  update: handlePost,
  testEmail: handleTestEmail,
  resendVerification: handleResendVerification,
  verifyPin: handleVerifyPin,
  cancelVerification: handleCancelVerification,
};

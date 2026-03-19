import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/csrf";
import { createCsrfToken } from "../../services/csrf";
import { log } from "../../services/logger";
import { setSessionCookie } from "../../services/sessions";
import { getStarCount } from "../../services/stars";
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
  const starCount = await getStarCount(user.id);
  const csrfToken = await createCsrfToken(sessionId, "POST", "/account");
  const logoutCsrfToken = await createCsrfToken(
    sessionId,
    "POST",
    "/auth/logout",
  );

  return render(
    <Account
      user={user}
      starCount={starCount}
      csrfToken={csrfToken}
      logoutCsrfToken={logoutCsrfToken}
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

    await updateUserPreferences(ctx.user.id, {
      emailOverride,
      digestDay,
      digestHour,
      timezone,
      isActive,
    });

    log.info("account", `Preferences updated for user ${ctx.user.id}`);

    setFlashCookie(req, "account", {
      type: "success",
      message: "Preferences saved.",
    });

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

export const account = {
  index: handleGet,
  update: handlePost,
};

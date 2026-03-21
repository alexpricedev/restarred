import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { createCsrfToken } from "../../services/csrf";
import { setSessionCookie } from "../../services/sessions";
import { Home } from "../../templates/home";
import { getFlashCookie } from "../../utils/flash";
import { render } from "../../utils/response";

export const home = {
  async index(req: BunRequest): Promise<Response> {
    const ctx = await getSessionContext(req);

    if (ctx.requiresSetCookie && ctx.sessionId) {
      setSessionCookie(req, ctx.sessionId);
    }

    let csrfToken: string | undefined;
    if (ctx.isAuthenticated && ctx.sessionId) {
      csrfToken = await createCsrfToken(ctx.sessionId, "POST", "/auth/logout");
    }

    const flash = getFlashCookie<{
      type: "success" | "error";
      message: string;
    }>(req, "home");
    const flashMessage = flash.type ? flash : undefined;

    return render(
      <Home user={ctx.user} csrfToken={csrfToken} flash={flashMessage} />,
    );
  },
};

import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { setSessionCookie } from "../../services/sessions";
import { Welcome } from "../../templates/welcome";
import { redirect, render } from "../../utils/response";

export const welcome = {
  async index(req: BunRequest): Promise<Response> {
    const ctx = await getSessionContext(req);

    if (!ctx.isAuthenticated || !ctx.user) {
      return redirect("/login");
    }

    if (ctx.requiresSetCookie && ctx.sessionId) {
      setSessionCookie(req, ctx.sessionId);
    }

    return render(<Welcome user={ctx.user} />);
  },
};

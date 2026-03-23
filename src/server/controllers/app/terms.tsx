import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { createCsrfToken } from "../../services/csrf";
import { Terms } from "../../templates/terms";
import { render } from "../../utils/response";

export const terms = {
  async index(req: BunRequest): Promise<Response> {
    const ctx = await getSessionContext(req);

    let csrfToken: string | undefined;
    if (ctx.isAuthenticated && ctx.sessionId) {
      csrfToken = await createCsrfToken(ctx.sessionId, "POST", "/auth/logout");
    }

    return render(<Terms user={ctx.user} csrfToken={csrfToken} />);
  },
};

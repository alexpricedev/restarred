import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { createCsrfToken } from "../../services/csrf";
import { Privacy } from "../../templates/privacy";
import { render } from "../../utils/response";

export const privacy = {
  async index(req: BunRequest): Promise<Response> {
    const ctx = await getSessionContext(req);

    let csrfToken: string | undefined;
    if (ctx.isAuthenticated && ctx.sessionId) {
      csrfToken = await createCsrfToken(ctx.sessionId, "POST", "/auth/logout");
    }

    return render(<Privacy user={ctx.user} csrfToken={csrfToken} />);
  },
};

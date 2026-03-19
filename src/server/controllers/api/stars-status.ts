import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { getSyncStatus } from "../../services/stars";

export const starsStatusApi = {
  async index(req: BunRequest): Promise<Response> {
    const ctx = await getSessionContext(req);

    if (!ctx.isAuthenticated || !ctx.user) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await getSyncStatus(ctx.user.id);
    return Response.json(result);
  },
};

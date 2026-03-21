import type { BunRequest } from "bun";
import { requireAdmin } from "../../middleware/admin";
import { getAdminStats } from "../../services/analytics";
import { createCsrfToken } from "../../services/csrf";
import type { RoleFilter } from "../../services/events";
import { AdminDashboard } from "../../templates/admin-dashboard";
import { render } from "../../utils/response";

const VALID_ROLES = new Set<RoleFilter>(["user", "admin", "all"]);

export const admin = {
  async index(req: BunRequest): Promise<Response> {
    const result = await requireAdmin(req);
    if (!result.authorized) return result.response;

    const url = new URL(req.url);
    const roleParam = url.searchParams.get("role") as RoleFilter | null;
    const roleFilter: RoleFilter =
      roleParam && VALID_ROLES.has(roleParam) ? roleParam : "user";

    const stats = await getAdminStats(roleFilter);

    let csrfToken: string | undefined;
    if (result.ctx.sessionId) {
      csrfToken = await createCsrfToken(
        result.ctx.sessionId,
        "POST",
        "/auth/logout",
      );
    }

    return render(
      <AdminDashboard
        stats={stats}
        user={result.ctx.user}
        csrfToken={csrfToken}
        roleFilter={roleFilter}
      />,
    );
  },
};

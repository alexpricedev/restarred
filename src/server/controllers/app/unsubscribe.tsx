import type { BunRequest } from "bun";
import { getSessionContext } from "../../middleware/auth";
import { trackEvent } from "../../services/events";
import { log } from "../../services/logger";
import { verifyUnsubscribeToken } from "../../services/unsubscribe";
import { deactivateUser, getUserRole } from "../../services/users";
import { Unsubscribe } from "../../templates/unsubscribe";
import { render } from "../../utils/response";

const handleGet = async (req: BunRequest): Promise<Response> => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const userId = verifyUnsubscribeToken(token);
  const ctx = await getSessionContext(req);

  if (!userId) {
    return render(
      <Unsubscribe state="error" isAuthenticated={ctx.isAuthenticated} />,
    );
  }

  return render(<Unsubscribe state="confirm" token={token} />);
};

const handlePost = async (req: BunRequest): Promise<Response> => {
  const url = new URL(req.url);
  const formData = await req.formData();

  const token =
    (formData.get("token") as string) || url.searchParams.get("token") || "";
  const userId = verifyUnsubscribeToken(token);
  const ctx = await getSessionContext(req);

  if (!userId) {
    return render(
      <Unsubscribe state="error" isAuthenticated={ctx.isAuthenticated} />,
    );
  }

  const role = await getUserRole(userId);
  await deactivateUser(userId);
  trackEvent("unsubscribe", { role: role ?? undefined }).catch((err) => {
    log.warn("events", `Failed to track unsubscribe: ${err}`);
  });
  log.info("unsubscribe", `User ${userId} unsubscribed via email link`);

  return render(
    <Unsubscribe state="success" isAuthenticated={ctx.isAuthenticated} />,
  );
};

export const unsubscribe = {
  index: handleGet,
  confirm: handlePost,
};

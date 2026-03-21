import type { BunRequest } from "bun";
import { log } from "../../services/logger";
import { verifyUnsubscribeToken } from "../../services/unsubscribe";
import { deactivateUser } from "../../services/users";
import { Unsubscribe } from "../../templates/unsubscribe";
import { render } from "../../utils/response";

const handleGet = async (req: BunRequest): Promise<Response> => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return render(<Unsubscribe state="error" />);
  }

  return render(<Unsubscribe state="confirm" token={token} />);
};

const handlePost = async (req: BunRequest): Promise<Response> => {
  const url = new URL(req.url);
  const formData = await req.formData();

  const token =
    (formData.get("token") as string) || url.searchParams.get("token") || "";
  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return render(<Unsubscribe state="error" />);
  }

  await deactivateUser(userId);
  log.info("unsubscribe", `User ${userId} unsubscribed via email link`);

  return render(<Unsubscribe state="success" />);
};

export const unsubscribe = {
  index: handleGet,
  confirm: handlePost,
};

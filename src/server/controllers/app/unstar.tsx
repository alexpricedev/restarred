import type { BunRequest } from "bun";
import { decrypt } from "../../services/encryption";
import { trackEvent } from "../../services/events";
import { unstarRepo } from "../../services/github-api";
import { log } from "../../services/logger";
import { removeLocalStar } from "../../services/stars";
import { verifyUnstarToken } from "../../services/unstar";
import { getUserById } from "../../services/users";
import { Unstar } from "../../templates/unstar";
import { render } from "../../utils/response";

const handleGet = async (req: BunRequest): Promise<Response> => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const result = verifyUnstarToken(token);

  if (!result) {
    return render(<Unstar state="error" />);
  }

  return render(
    <Unstar state="confirm" token={token} fullName={result.fullName} />,
  );
};

const handlePost = async (req: BunRequest): Promise<Response> => {
  let token = "";
  try {
    const formData = await req.formData();
    token = (formData.get("token") as string) || "";
  } catch {
    return render(<Unstar state="error" />);
  }

  const result = verifyUnstarToken(token);
  if (!result) {
    return render(<Unstar state="error" />);
  }

  const { userId, fullName } = result;

  const user = await getUserById(userId);
  if (!user) {
    return render(
      <Unstar
        state="error"
        errorMessage="Account not found. You can unstar this repo directly on GitHub."
      />,
    );
  }

  try {
    const accessToken = decrypt(user.github_token);
    const success = await unstarRepo(accessToken, fullName);

    if (!success) {
      return render(
        <Unstar
          state="error"
          fullName={fullName}
          errorMessage="GitHub couldn't process this request. Try unstarring directly on GitHub."
        />,
      );
    }

    await removeLocalStar(userId, fullName);

    trackEvent("repo_unstarred", { source: "digest" }).catch((err) => {
      log.warn("events", `Failed to track repo_unstarred: ${err}`);
    });
    log.info("unstar", `User ${userId} unstarred ${fullName} via digest`);

    return render(<Unstar state="success" fullName={fullName} />);
  } catch (error) {
    log.error(
      "unstar",
      `Failed to unstar ${fullName} for user ${userId}: ${error}`,
    );
    return render(
      <Unstar
        state="error"
        fullName={fullName}
        errorMessage="Something went wrong. Try unstarring directly on GitHub."
      />,
    );
  }
};

export const unstar = {
  index: handleGet,
  confirm: handlePost,
};

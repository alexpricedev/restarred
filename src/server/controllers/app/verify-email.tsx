import type { BunRequest } from "bun";
import { verifyToken } from "../../services/email-verification";
import { log } from "../../services/logger";
import { VerifyEmail } from "../../templates/verify-email";
import { render } from "../../utils/response";

const handleGet = async (req: BunRequest): Promise<Response> => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  if (!token) {
    return render(<VerifyEmail state="invalid" />);
  }

  try {
    const result = await verifyToken(token);

    if (result.success) {
      return render(<VerifyEmail state="success" email={result.email} />);
    }

    if (result.reason === "expired") {
      return render(<VerifyEmail state="expired" />);
    }

    return render(<VerifyEmail state="invalid" />);
  } catch (error) {
    log.error(
      "verify-email",
      `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return render(<VerifyEmail state="invalid" />);
  }
};

export const verifyEmail = {
  index: handleGet,
};

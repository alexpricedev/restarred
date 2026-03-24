import { generateSecureToken } from "../../utils/crypto";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

export const github = {
  index(): Response {
    const clientId = process.env.GITHUB_CLIENT_ID as string;
    const appUrl = process.env.APP_URL as string;
    const callbackUrl = `${appUrl}/auth/callback`;
    const state = generateSecureToken(32);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: "read:user user:email public_repo",
      state,
    });

    const response = new Response("", {
      status: 302,
      headers: { Location: `${GITHUB_AUTHORIZE_URL}?${params.toString()}` },
    });

    response.headers.append(
      "Set-Cookie",
      `github_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );

    return response;
  },
};

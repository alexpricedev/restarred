import { Layout } from "@server/components/layouts";

type UnsubscribeState = "confirm" | "success" | "error";

interface UnsubscribeProps {
  state: UnsubscribeState;
  token?: string;
}

export const Unsubscribe = ({ state, token }: UnsubscribeProps) => (
  <Layout
    title="re:starred — Unsubscribe"
    description="Unsubscribe from re:starred digest emails."
    name="unsubscribe"
  >
    <div className="unsubscribe-container">
      {state === "confirm" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">UNSUBSCRIBE</h1>
          <p className="unsubscribe-description">
            You'll stop receiving weekly digest emails from re:starred.
          </p>
          <form method="POST" action="/unsubscribe">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="unsubscribe-button">
              Confirm unsubscribe
            </button>
          </form>
        </div>
      )}
      {state === "success" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">UNSUBSCRIBED</h1>
          <p className="unsubscribe-description">
            You won't receive any more digest emails.
          </p>
          <p className="unsubscribe-resubscribe">
            Changed your mind? Log in and re-enable digests from your{" "}
            <a href="/account">account settings</a>.
          </p>
        </div>
      )}
      {state === "error" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">INVALID LINK</h1>
          <p className="unsubscribe-description">
            This unsubscribe link is invalid or has expired.
          </p>
          <p className="unsubscribe-resubscribe">
            You can manage your digest preferences from your{" "}
            <a href="/account">account settings</a>.
          </p>
        </div>
      )}
    </div>
  </Layout>
);

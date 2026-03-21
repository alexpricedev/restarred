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
          <div className="unsubscribe-reactivate">
            <span className="unsubscribe-reactivate-label">
              CHANGED YOUR MIND?
            </span>
            <p className="unsubscribe-reactivate-text">
              Sign in to re-enable your weekly digest at any time.
            </p>
            <a href="/" className="unsubscribe-reactivate-link">
              Go to re:starred
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
      {state === "error" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">INVALID LINK</h1>
          <p className="unsubscribe-description">
            This unsubscribe link is invalid or has expired.
          </p>
          <div className="unsubscribe-reactivate">
            <p className="unsubscribe-reactivate-text">
              Sign in to manage your digest preferences.
            </p>
            <a href="/" className="unsubscribe-reactivate-link">
              Go to re:starred
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  </Layout>
);

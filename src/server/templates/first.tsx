import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface FirstProps {
  user: User;
  starCount: number;
  sendCsrfToken: string;
  skipCsrfToken: string;
  error?: string;
}

export const First = ({
  user,
  starCount,
  sendCsrfToken,
  skipCsrfToken,
  error,
}: FirstProps) => (
  <Layout
    title="re:starred — Your Stars Are Ready"
    description="Choose when to receive your first digest."
    name="first"
    user={user}
  >
    <div className="first-content">
      <div className="first-initial">
        <span className="first-label">SYNC COMPLETE</span>
        <h1 className="first-heading">
          {starCount.toLocaleString()} REPOS READY
        </h1>
        <p className="first-description">
          Each week, we'll email you 3 forgotten starred repos. Want to see what
          that looks like right now?
        </p>
        {error && <p className="first-error">{error}</p>}
        <div className="first-consent">
          <label className="first-consent-checkbox">
            <span>
              I agree to receive weekly digest emails from re:starred.
            </span>
            <input type="checkbox" data-consent-checkbox />
            <svg
              className="first-check-empty"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
            </svg>
            <svg
              className="first-check-filled"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </label>
          <p className="first-consent-unsub">
            You can unsubscribe at any time.
          </p>
          <p className="first-consent-legal">
            By continuing, you accept our{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="first-actions">
          <form method="POST" action="/first/send" data-send-form>
            <input type="hidden" name="_csrf" value={sendCsrfToken} />
            <input type="hidden" name="consent" value="" data-consent-field />
            <button
              type="submit"
              className="first-btn first-btn-primary"
              disabled
            >
              SEND MY FIRST DIGEST NOW
            </button>
          </form>
          <form method="POST" action="/first/skip">
            <input type="hidden" name="_csrf" value={skipCsrfToken} />
            <input type="hidden" name="consent" value="" data-consent-field />
            <button
              type="submit"
              className="first-btn first-btn-secondary"
              disabled
            >
              I'll wait for my regular digest
            </button>
          </form>
        </div>
      </div>
      <div className="first-success" hidden>
        <span className="first-label">DIGEST SENT</span>
        <h1 className="first-heading">CHECK YOUR INBOX</h1>
        <p className="first-description">
          Your first digest is on its way. We'll send you a fresh one every week
          from here.
        </p>
        <div className="first-actions">
          <a href="/account" className="first-btn first-btn-primary">
            GO TO MY ACCOUNT
          </a>
        </div>
      </div>
    </div>
  </Layout>
);

import { Layout } from "@server/components/layouts";

type VerifyEmailState = "success" | "expired" | "invalid";

interface VerifyEmailProps {
  state: VerifyEmailState;
  email?: string;
}

export const VerifyEmail = ({ state, email }: VerifyEmailProps) => (
  <Layout
    title="re:starred — Verify Email"
    description="Verify your email address for re:starred."
    name="verify-email"
  >
    <div className="unsubscribe-container">
      {state === "success" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">EMAIL VERIFIED</h1>
          <p className="unsubscribe-description">
            {email
              ? `Your digest will now be delivered to ${email}.`
              : "Your email address has been verified."}
          </p>
          <a href="/account" className="unsubscribe-reactivate-link">
            Go to account settings
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
      )}
      {state === "expired" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">LINK EXPIRED</h1>
          <p className="unsubscribe-description">
            This verification link has expired. You can request a new one from
            your account settings.
          </p>
          <a href="/account" className="unsubscribe-reactivate-link">
            Go to account settings
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
      )}
      {state === "invalid" && (
        <div className="unsubscribe-content">
          <h1 className="unsubscribe-heading">INVALID LINK</h1>
          <p className="unsubscribe-description">
            This verification link is invalid. You can request a new one from
            your account settings.
          </p>
          <a href="/account" className="unsubscribe-reactivate-link">
            Go to account settings
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
      )}
    </div>
  </Layout>
);

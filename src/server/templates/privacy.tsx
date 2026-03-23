import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface PrivacyProps {
  user: User | null;
  csrfToken?: string;
}

export const Privacy = ({ user, csrfToken }: PrivacyProps) => (
  <Layout
    title="re:starred — Privacy Policy"
    description="Privacy Policy for re:starred."
    name="privacy"
    user={user}
    csrfToken={csrfToken}
  >
    <div className="legal-container">
      <span className="legal-label">LEGAL</span>
      <h1 className="legal-heading">PRIVACY POLICY</h1>
      <p className="legal-updated">Last updated: March 2026</p>

      <div className="legal-content">
        <h2>1. Information We Collect</h2>
        <p>When you sign up, we collect:</p>
        <ul>
          <li>
            <strong>GitHub profile data:</strong> your username, email address,
            and user ID
          </li>
          <li>
            <strong>GitHub starred repositories:</strong> the list of
            repositories you have starred
          </li>
          <li>
            <strong>Consent records:</strong> when you consented and to what
          </li>
        </ul>
        <p>
          We do not collect analytics cookies, tracking pixels, or any data
          beyond what is listed above.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>Your information is used exclusively to:</p>
        <ul>
          <li>Send you a weekly email digest of forgotten starred repos</li>
          <li>Authenticate your account via GitHub OAuth</li>
          <li>Improve the Service (aggregate, anonymised usage statistics)</li>
        </ul>

        <h2>3. Data Storage and Security</h2>
        <p>
          Your GitHub access token is encrypted at rest. Your data is stored on
          servers within the EU/US. We use industry-standard security measures
          to protect your information.
        </p>

        <h2>4. Data Sharing</h2>
        <p>
          We do not sell, trade, or share your personal information with third
          parties. Email delivery is handled by a third-party email service
          provider who processes your email address solely for delivery
          purposes.
        </p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> your data via your account settings page
          </li>
          <li>
            <strong>Delete</strong> your account and all associated data at any
            time
          </li>
          <li>
            <strong>Withdraw consent</strong> to email communications by
            unsubscribing
          </li>
          <li>
            <strong>Request a copy</strong> of your data by contacting us
          </li>
        </ul>
        <p>
          Under GDPR (UK/EU), you also have the right to rectification, data
          portability, and to lodge a complaint with a supervisory authority.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          Your data is retained for as long as your account is active. When you
          delete your account, all associated data (profile, stars, digest
          history, consent records) is permanently deleted within 24 hours.
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use only essential cookies for authentication and session
          management. No tracking or advertising cookies are used.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of significant changes via email.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about this policy? Open an issue on our{" "}
          <a
            href="https://github.com/alexpricedev/restarred/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>{" "}
          or visit our <a href="/feedback">feedback page</a>.
        </p>
      </div>
    </div>
  </Layout>
);

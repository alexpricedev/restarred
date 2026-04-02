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
        <h2>1. Who we are</h2>
        <p>
          The data controller is Alex Price (individual), operating re:starred
          at{" "}
          <a
            href="https://restarred.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            restarred.dev
          </a>
          .
        </p>
        <p>
          Contact:{" "}
          <a href="mailto:privacy@digest.restarred.dev">
            privacy@digest.restarred.dev
          </a>
        </p>

        <h2>2. Information we collect</h2>
        <p>We collect three categories of information:</p>

        <h3>Account data (from GitHub OAuth)</h3>
        <ul>
          <li>GitHub user ID, username, display name, and email address</li>
          <li>GitHub access token (encrypted at rest using AES-256-GCM)</li>
        </ul>

        <h3>Starred repositories</h3>
        <ul>
          <li>
            The repos you've starred on GitHub — name, description, language,
            star count, URL, when you starred it, and last activity date
          </li>
        </ul>

        <h3>Data we generate</h3>
        <ul>
          <li>
            <strong>Consent records:</strong> what you consented to, when, your
            IP address and user agent at the time
          </li>
          <li>
            <strong>Session data:</strong> a hashed session identifier stored in
            our database
          </li>
          <li>
            <strong>Email verification records:</strong> temporary hashed PINs
            when you change your email (auto-expire after 24 hours)
          </li>
          <li>
            <strong>Event logs:</strong> anonymised usage events (e.g. "a user
            signed up", "a digest was sent") — these record event type and
            account role, not your identity
          </li>
          <li>
            <strong>Digest history:</strong> which repos were included in each
            weekly email we sent you
          </li>
        </ul>

        <h2>3. How we use your information</h2>
        <ul>
          <li>
            <strong>To deliver your digest:</strong> we analyse your starred
            repos to find forgotten ones and email them to you weekly, on the
            day and time you choose
          </li>
          <li>
            <strong>To authenticate you:</strong> your GitHub OAuth token lets
            us verify your identity and fetch your stars
          </li>
          <li>
            <strong>To communicate:</strong> verification emails when you change
            your email address, and service notifications about significant
            changes
          </li>
          <li>
            <strong>To improve the service:</strong> anonymised, aggregate event
            data (not tied to your identity) helps us understand how the service
            is used
          </li>
        </ul>

        <h2>4. Legal basis for processing (GDPR)</h2>
        <ul>
          <li>
            <strong>Consent:</strong> sending you digest emails — you explicitly
            opt in during signup and can withdraw anytime
          </li>
          <li>
            <strong>Legitimate interest:</strong> account authentication,
            session management, and anonymised analytics to improve the service
          </li>
          <li>
            <strong>Legal obligation:</strong> maintaining consent records
            (we're required to prove you consented)
          </li>
        </ul>

        <h2>5. Cookies</h2>
        <p>
          We use only essential cookies. No tracking, advertising, or analytics
          cookies.
        </p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>session_id</td>
              <td>Keeps you logged in</td>
              <td>30 days</td>
            </tr>
            <tr>
              <td>github_oauth_state</td>
              <td>Prevents CSRF during GitHub login</td>
              <td>Deleted immediately after login</td>
            </tr>
          </tbody>
        </table>

        <h2>6. Data sharing and third parties</h2>
        <p>We do not sell, trade, or share your personal information.</p>
        <p>Two third parties process data on our behalf:</p>
        <ul>
          <li>
            <strong>GitHub</strong> (github.com) — we use their API to
            authenticate you and fetch your starred repositories. Their privacy
            policy applies to data you share with GitHub directly.
          </li>
          <li>
            <strong>Resend</strong> (resend.com) — delivers emails on our
            behalf. They process your email address solely for delivery. They do
            not retain or use it for other purposes.
          </li>
        </ul>
        <p>No other third parties receive your data.</p>

        <h2>7. Data retention and deletion</h2>
        <ul>
          <li>
            <strong>While your account is active:</strong> all data described in
            Section 2 is retained
          </li>
          <li>
            <strong>When you delete your account:</strong> your profile, stars,
            digest history, consent records, sessions, and email verifications
            are permanently deleted immediately. Your GitHub OAuth grant is also
            revoked.
          </li>
          <li>
            <strong>What remains:</strong> anonymised event logs (e.g. "a user
            signed up") are retained for aggregate analytics. These are not
            linked to your identity and cannot be used to identify you.
          </li>
        </ul>

        <h2>8. Your rights</h2>
        <h3>Everyone</h3>
        <ul>
          <li>Access your data via your account settings</li>
          <li>Delete your account and all associated data at any time</li>
          <li>
            Withdraw consent to emails by unsubscribing (via email link or
            account settings)
          </li>
        </ul>

        <h3>Under GDPR (UK/EU)</h3>
        <ul>
          <li>Request a copy of your data in a portable format</li>
          <li>Request rectification of inaccurate data</li>
          <li>Object to processing based on legitimate interest</li>
          <li>
            Lodge a complaint with your local supervisory authority (e.g. the
            ICO in the UK)
          </li>
        </ul>

        <h3>Under CCPA (California)</h3>
        <ul>
          <li>Know what personal information we collect and why</li>
          <li>Request deletion of your personal information</li>
          <li>
            We do not sell personal information, so the right to opt out of sale
            does not apply
          </li>
        </ul>

        <p>
          For any of these requests, contact{" "}
          <a href="mailto:privacy@digest.restarred.dev">
            privacy@digest.restarred.dev
          </a>
          .
        </p>

        <h2>9. International data transfers</h2>
        <p>
          Your data is stored on servers in the EU and US. If you are accessing
          the service from outside these regions, your data will be transferred
          internationally. We rely on standard contractual clauses and provider
          compliance frameworks to ensure adequate protection.
        </p>

        <h2>10. Age restriction</h2>
        <p>
          re:starred is not intended for anyone under 16. We do not knowingly
          collect data from children. If you believe a child has provided us
          data, contact us and we will delete it.
        </p>

        <h2>11. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. For significant changes,
          we will notify you by email. The "last updated" date at the top will
          always reflect the current version.
        </p>
      </div>
    </div>
  </Layout>
);

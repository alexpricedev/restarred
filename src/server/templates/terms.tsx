import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface TermsProps {
  user: User | null;
  csrfToken?: string;
}

export const Terms = ({ user, csrfToken }: TermsProps) => (
  <Layout
    title="re:starred — Terms of Service"
    description="Terms of Service for re:starred."
    name="terms"
    user={user}
    csrfToken={csrfToken}
  >
    <div className="legal-container">
      <span className="legal-label">LEGAL</span>
      <h1 className="legal-heading">TERMS OF SERVICE</h1>
      <p className="legal-updated">Last updated: March 2026</p>

      <div className="legal-content">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using re:starred ("the Service"), you agree to be
          bound by these Terms of Service and our{" "}
          <a href="/privacy">Privacy Policy</a>. Together, they govern your use
          of the Service. If you do not agree, do not use the Service.
        </p>
        <p>You must be at least 16 years old to use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>
          re:starred is a free service that sends you a weekly email digest of
          forgotten GitHub starred repositories. The Service requires you to
          authenticate via GitHub OAuth and grant read-only access to your
          starred repositories. We analyse your stars to surface repos you may
          have forgotten about.
        </p>

        <h2>3. Your Account</h2>
        <p>
          Your account is created via GitHub OAuth. You are responsible for
          maintaining the security of your GitHub account and any activity that
          occurs through your re:starred account.
        </p>
        <p>
          You must provide accurate information when signing up. You may delete
          your account at any time from your account settings page. Account
          deletion is immediate and permanent — all your data is removed as
          described in our <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>4. GitHub Integration</h2>
        <p>
          We request read-only access to your starred repositories via GitHub
          OAuth. Your GitHub access token is encrypted at rest using
          AES-256-GCM. We never modify your GitHub data — we only read your
          starred repositories to build your digest.
        </p>
        <p>
          GitHub's own Terms of Service apply to your GitHub account. Our access
          to your data is subject to the permissions you grant during
          authentication.
        </p>

        <h2>5. Email Communications</h2>
        <p>
          You explicitly opt in to receive digest emails during onboarding. Your
          weekly digest is sent on the day and time you choose.
        </p>
        <p>
          You can unsubscribe at any time via the unsubscribe link in any digest
          email or from your account settings. We will stop sending digest
          emails within 24 hours of your unsubscribe request.
        </p>
        <p>
          Service notifications (e.g. changes to these terms or our privacy
          policy) may be sent regardless of your digest preference.
        </p>

        <h2>6. Data and Privacy</h2>
        <p>
          Full details about how we collect, use, and protect your data are in
          our <a href="/privacy">Privacy Policy</a>. In summary:
        </p>
        <ul>
          <li>
            We collect account data (from GitHub OAuth), your starred
            repositories, and consent records
          </li>
          <li>We do not sell your data</li>
          <li>
            Your rights under GDPR and CCPA are detailed in our{" "}
            <a href="/privacy">Privacy Policy</a>
          </li>
        </ul>

        <h2>7. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Access or attempt to access other users' data</li>
          <li>Circumvent rate limits or other technical restrictions</li>
          <li>Scrape, crawl, or automate access to the Service</li>
          <li>Impersonate another person or entity</li>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to reverse-engineer any part of the Service</li>
          <li>Interfere with the operation or availability of the Service</li>
        </ul>

        <h2>8. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are
          owned by re:starred. Your GitHub data remains yours.
        </p>
        <p>
          You grant us only the limited licence needed to provide the Service —
          specifically, fetching and analysing your starred repositories to
          build your weekly digest.
        </p>

        <h2>9. Third-Party Services</h2>
        <p>The Service relies on two third parties:</p>
        <ul>
          <li>
            <strong>GitHub</strong> (github.com) — authentication and star data.
            Their Terms of Service apply to your use of GitHub.
          </li>
          <li>
            <strong>Resend</strong> (resend.com) — email delivery. Their Terms
            of Service apply to their processing of your email address.
          </li>
        </ul>
        <p>
          We are not responsible for the availability of third-party services or
          changes to their terms.
        </p>

        <h2>10. Service Availability and Modifications</h2>
        <p>
          The Service is provided on a reasonable-efforts basis. We do not
          guarantee any specific uptime or availability.
        </p>
        <p>
          We may modify, suspend, or discontinue the Service at any time. Where
          possible, planned changes will be communicated via email in advance.
        </p>

        <h2>11. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties
          of any kind, whether express or implied. We do not guarantee the
          accuracy, reliability, or completeness of any content delivered
          through the Service.
        </p>
        <p>
          We are not responsible for changes to the GitHub API that may affect
          the Service's functionality.
        </p>

        <h2>12. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, re:starred shall not be liable
          for any indirect, incidental, special, or consequential damages
          arising from your use of the Service.
        </p>
        <p>
          Our total liability is capped at the amount you have paid to use the
          Service, which is zero — the Service is free.
        </p>
        <p>
          Nothing in these terms excludes liability for fraud or for death or
          personal injury caused by negligence.
        </p>

        <h2>13. Indemnification</h2>
        <p>
          You agree to indemnify and hold re:starred harmless against any
          claims, damages, or expenses arising from your misuse of the Service
          or violation of these terms.
        </p>

        <h2>14. Termination</h2>
        <p>
          You can terminate your use of the Service at any time by deleting your
          account from your account settings. We may terminate or suspend your
          account if you violate these terms.
        </p>
        <p>
          On termination, all your data is deleted in accordance with our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
        <p>
          Sections that by their nature should survive termination will survive,
          including Limitation of Liability, Indemnification, and Governing Law.
        </p>

        <h2>15. Governing Law and Disputes</h2>
        <p>
          These terms are governed by the laws of England and Wales. If a
          dispute arises, we encourage you to contact us first to seek informal
          resolution. If the dispute cannot be resolved informally, the courts
          of England and Wales shall have exclusive jurisdiction.
        </p>

        <h2>16. Severability</h2>
        <p>
          If any provision of these terms is found to be invalid or
          unenforceable, the remaining provisions will continue in full force
          and effect.
        </p>

        <h2>17. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. For material changes, we
          will notify you by email. Continued use of the Service after
          notification constitutes acceptance of the updated terms.
        </p>
        <p>
          If you disagree with the changes, you should stop using the Service
          and delete your account.
        </p>

        <h2>18. Contact</h2>
        <p>
          Questions about these terms? Open an issue on our{" "}
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

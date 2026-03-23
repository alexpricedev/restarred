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
          bound by these Terms of Service. If you do not agree, do not use the
          Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          re:starred is a free service that sends you a weekly email digest of
          forgotten GitHub starred repositories. The Service requires you to
          authenticate with your GitHub account and grant read access to your
          starred repositories.
        </p>

        <h2>3. Your Account</h2>
        <p>
          You are responsible for maintaining the security of your GitHub
          account. You must provide accurate information when signing up. You
          may delete your account at any time from your account settings page.
        </p>

        <h2>4. Email Communications</h2>
        <p>
          By consenting during onboarding, you agree to receive a weekly email
          digest. You can unsubscribe at any time via the unsubscribe link in
          any email or from your account settings. We will stop sending emails
          within 24 hours of your unsubscribe request.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>
          You agree not to misuse the Service, including but not limited to:
          attempting to access other users' data, circumventing rate limits, or
          using the Service for any unlawful purpose.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are
          owned by re:starred. Your GitHub data remains yours.
        </p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. We do
          not guarantee uninterrupted or error-free operation.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, re:starred shall not be liable
          for any indirect, incidental, special, or consequential damages
          arising from your use of the Service.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the
          Service after changes constitutes acceptance of the new Terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these Terms? Open an issue on our{" "}
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

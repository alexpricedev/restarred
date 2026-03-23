import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface FeedbackProps {
  user: User | null;
  csrfToken?: string;
}

const GITHUB_REPO = "https://github.com/alexpricedev/restarred";

export const Feedback = ({ user, csrfToken }: FeedbackProps) => (
  <Layout
    title="re:starred — Feedback"
    description="Report a bug, request a feature, or get in touch."
    name="feedback"
    user={user}
    csrfToken={csrfToken}
  >
    <div className="feedback-container">
      <span className="feedback-label">FEEDBACK</span>
      <h1 className="feedback-heading">I'D LOVE TO HEAR FROM YOU</h1>
      <p className="feedback-description">
        Found a bug? Got an idea? Open an issue on GitHub and I'll take a look.
      </p>

      <div className="feedback-cards">
        <a
          href={`${GITHUB_REPO}/issues/new?template=bug_report.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="feedback-card"
        >
          <span className="feedback-card-label">BUG REPORT</span>
          <p className="feedback-card-description">
            Something isn't working as expected.
          </p>
          <span className="feedback-card-arrow">&rarr;</span>
        </a>

        <a
          href={`${GITHUB_REPO}/issues/new?template=feature_request.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="feedback-card"
        >
          <span className="feedback-card-label">FEATURE REQUEST</span>
          <p className="feedback-card-description">
            Suggest an idea for re:starred.
          </p>
          <span className="feedback-card-arrow">&rarr;</span>
        </a>
      </div>

      <div className="feedback-contact">
        <span className="feedback-contact-label">PREFER EMAIL?</span>
        <p className="feedback-contact-description">
          Reach out at{" "}
          <a href="mailto:restarred@alexprice.dev">restarred@alexprice.dev</a>{" "}
          or visit{" "}
          <a
            href="https://alexprice.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            alexprice.dev
          </a>
        </p>
      </div>

      <div className="feedback-support">
        <span className="feedback-support-label">SUPPORT</span>
        <p className="feedback-support-description">
          re:starred is built and maintained by one person. Your support helps
          cover email and hosting costs.{" "}
          <a
            href="https://buymeacoffee.com/alexpricedev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy me a coffee
          </a>
        </p>
      </div>
    </div>
  </Layout>
);

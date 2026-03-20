import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface WelcomeProps {
  user: User;
}

export const Welcome = ({ user }: WelcomeProps) => (
  <Layout
    title="re:starred — Syncing Your Stars"
    description="We're syncing your starred GitHub repos. This only happens once."
    name="welcome"
    user={user}
  >
    <div className="welcome-container">
      <div className="welcome-content">
        <span className="welcome-label">
          WELCOME, {user.github_username?.toUpperCase()}
        </span>
        <h1 className="welcome-heading">SYNCING YOUR STARS</h1>
        <p className="welcome-description">
          We're fetching your starred repositories from GitHub. This only
          happens once.
        </p>
        <ol className="welcome-steps" id="sync-steps">
          <li className="welcome-step is-active" id="step-connect">
            <span className="welcome-step-indicator" />
            <span className="welcome-step-label">Connecting to GitHub...</span>
          </li>
          <li className="welcome-step" id="step-fetch">
            <span className="welcome-step-indicator" />
            <span className="welcome-step-label">
              Fetching your starred repos...
            </span>
            <span className="welcome-step-count" id="sync-count" />
          </li>
          <li className="welcome-step" id="step-done">
            <span className="welcome-step-indicator" />
            <span className="welcome-step-label">All set! Redirecting...</span>
          </li>
        </ol>
      </div>
    </div>
  </Layout>
);

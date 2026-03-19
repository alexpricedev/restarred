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
        <div className="welcome-progress">
          <div className="welcome-spinner" />
          <span className="welcome-status" id="sync-status">
            Connecting to GitHub...
          </span>
        </div>
        <p className="welcome-count" id="sync-count" />
      </div>
    </div>
  </Layout>
);

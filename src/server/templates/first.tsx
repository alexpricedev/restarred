import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface FirstProps {
  user: User;
  starCount: number;
  sendCsrfToken: string;
  skipCsrfToken: string;
}

export const First = ({
  user,
  starCount,
  sendCsrfToken,
  skipCsrfToken,
}: FirstProps) => (
  <Layout
    title="re:starred — Your Stars Are Ready"
    description="Choose when to receive your first digest."
    name="first"
    user={user}
  >
    <div className="first-container">
      <div className="first-content">
        <span className="first-label">SYNC COMPLETE</span>
        <h1 className="first-heading">{starCount} REPOS READY</h1>
        <p className="first-description">
          Every week, we'll email you 3 forgotten repos from your stars. Want to
          see what that looks like right now?
        </p>
        <div className="first-actions">
          <form method="POST" action="/first/send">
            <input type="hidden" name="_csrf" value={sendCsrfToken} />
            <button type="submit" className="first-btn first-btn-primary">
              Send my first digest now
            </button>
          </form>
          <form method="POST" action="/first/skip">
            <input type="hidden" name="_csrf" value={skipCsrfToken} />
            <button type="submit" className="first-btn first-btn-secondary">
              I'll wait for my regular digest
            </button>
          </form>
        </div>
      </div>
    </div>
  </Layout>
);

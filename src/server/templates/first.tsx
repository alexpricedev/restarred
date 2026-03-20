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
        <div className="first-actions">
          <form method="POST" action="/first/send" data-send-form>
            <input type="hidden" name="_csrf" value={sendCsrfToken} />
            <button type="submit" className="first-btn first-btn-primary">
              SEND MY FIRST DIGEST NOW
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

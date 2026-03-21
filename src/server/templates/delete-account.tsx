import { CsrfField } from "@server/components/csrf-field";
import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface DeleteAccountProps {
  user: User;
  csrfToken: string;
  logoutCsrfToken: string;
}

export const DeleteAccount = ({
  user,
  csrfToken,
  logoutCsrfToken,
}: DeleteAccountProps) => (
  <Layout
    title="re:starred — Delete Account"
    description="Permanently delete your re:starred account and all associated data."
    name="delete-account"
    user={user}
    csrfToken={logoutCsrfToken}
  >
    <div className="delete-account-container">
      <a href="/account" className="delete-account-back">
        &larr; Back to account
      </a>

      <div className="delete-account-content">
        <span className="delete-account-label">DANGER ZONE</span>
        <h1 className="delete-account-heading">Delete your account</h1>
        <p className="delete-account-description">
          This will permanently delete your re:starred{" "}
          <strong>{user.github_username}</strong> account and all associated
          data, including:
        </p>
        <ul className="delete-account-list">
          <li>All synced starred repos</li>
          <li>Digest history and preferences</li>
          <li>Your session and login data</li>
          <li>The connection between your GitHub account and re:starred</li>
        </ul>
        <p className="delete-account-warning">This action cannot be undone.</p>

        <form method="POST" action="/account/delete">
          <CsrfField token={csrfToken} />
          <button type="submit" className="delete-account-button">
            Delete my account
          </button>
        </form>
      </div>
    </div>
  </Layout>
);

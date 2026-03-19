import type { User } from "../services/users";
import { CsrfField } from "./csrf-field";

interface NavProps {
  page: string;
  user?: User | null;
  csrfToken?: string;
}

export const Nav = ({ page, user, csrfToken }: NavProps) => (
  <nav data-component="nav" aria-label="Main navigation">
    {user ? (
      <div className="nav-actions">
        <a
          href="/account"
          className="nav-link"
          aria-current={page === "account" ? "page" : undefined}
        >
          Account
        </a>
        <form method="post" action="/auth/logout" className="nav-logout">
          <CsrfField token={csrfToken ?? null} />
          <button type="submit" className="nav-cta">
            Sign out
          </button>
        </form>
      </div>
    ) : (
      <a href="/auth/github" className="nav-cta">
        Sign in
      </a>
    )}
  </nav>
);

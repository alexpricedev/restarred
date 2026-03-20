import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface WelcomeProps {
  user: User;
}

const IconCheck = () => (
  <span className="welcome-step-icon welcome-icon-check">
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  </span>
);

const IconLoader = () => (
  <span className="welcome-step-icon welcome-icon-loader">
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  </span>
);

const IconPending = () => (
  <span className="welcome-step-icon welcome-icon-pending">
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />
      <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />
      <path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" />
      <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />
      <path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" />
      <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />
      <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />
      <path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" />
    </svg>
  </span>
);

const StepIcons = () => (
  <>
    <IconCheck />
    <IconLoader />
    <IconPending />
  </>
);

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
          We're fetching your starred repositories from GitHub.
          <br />
          This only happens once.
        </p>
        <ol className="welcome-steps" id="sync-steps">
          <li className="welcome-step is-active" id="step-connect">
            <StepIcons />
            <span className="welcome-step-label">Connecting to GitHub...</span>
          </li>
          <li className="welcome-step" id="step-fetch">
            <StepIcons />
            <span className="welcome-step-label">
              Fetching your starred repos...
            </span>
          </li>
          <li className="welcome-step" id="step-done">
            <StepIcons />
            <span className="welcome-step-label">All set! Redirecting...</span>
          </li>
        </ol>
      </div>
    </div>
  </Layout>
);

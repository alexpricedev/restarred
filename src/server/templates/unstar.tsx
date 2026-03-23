import { Layout } from "@server/components/layouts";

type UnstarState = "confirm" | "success" | "error";

interface UnstarProps {
  state: UnstarState;
  token?: string;
  fullName?: string;
  errorMessage?: string;
}

export const Unstar = ({
  state,
  token,
  fullName,
  errorMessage,
}: UnstarProps) => (
  <Layout
    title="re:starred — Unstar"
    description="Unstar a repository from your GitHub stars."
    name="unstar"
  >
    <div className="unstar-container">
      {state === "confirm" && (
        <div className="unstar-content">
          <h1 className="unstar-heading">UNSTAR</h1>
          <p className="unstar-description">
            This will remove <strong>{fullName}</strong> from your GitHub stars.
          </p>
          <form method="POST" action="/unstar">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="unstar-button">
              Confirm unstar
            </button>
          </form>
        </div>
      )}
      {state === "success" && (
        <div className="unstar-content">
          <h1 className="unstar-heading">UNSTARRED</h1>
          <p className="unstar-description">
            <strong>{fullName}</strong> has been removed from your GitHub stars.
          </p>
          <button
            type="button"
            className="unstar-close-button"
            data-close-window
          >
            Close
          </button>
        </div>
      )}
      {state === "error" && (
        <div className="unstar-content">
          <h1 className="unstar-heading">COULDN'T UNSTAR</h1>
          <p className="unstar-description">
            {errorMessage || "This unstar link is invalid or has expired."}
          </p>
          <p className="unstar-fallback">
            You can unstar this repo directly on{" "}
            <a href="https://github.com" className="unstar-github-link">
              GitHub
            </a>
            .
          </p>
        </div>
      )}
    </div>
  </Layout>
);

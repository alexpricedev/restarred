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
            This will remove{" "}
            <a
              href={`https://github.com/${fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="unstar-repo-link"
            >
              <strong>{fullName}</strong>
              <svg
                className="unstar-external-icon"
                viewBox="0 0 16 16"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"
                />
              </svg>
            </a>{" "}
            from your GitHub stars.
          </p>
          <form method="POST" action="/unstar">
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="unstar-button">
              Confirm & Unstar
            </button>
          </form>
        </div>
      )}
      {state === "success" && (
        <div className="unstar-content">
          <h1 className="unstar-heading">UNSTARRED</h1>
          <p className="unstar-description">
            <a
              href={`https://github.com/${fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="unstar-repo-link"
            >
              <strong>{fullName}</strong>
              <svg
                className="unstar-external-icon"
                viewBox="0 0 16 16"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"
                />
              </svg>
            </a>{" "}
            has been removed from your GitHub stars.
          </p>
          <p className="unstar-fallback">You can close this tab.</p>
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

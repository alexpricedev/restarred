const repos = [
  {
    owner: "charmbracelet",
    name: "vhs",
    description: "Your CLI home video recorder. Write terminal GIFs as code.",
    language: "Go",
    stars: "15.2k",
    status: "Active",
    updated: "3d ago",
  },
  {
    owner: "tldraw",
    name: "tldraw",
    description: "A tiny little drawing app. Collaborative whiteboard SDK.",
    language: "TypeScript",
    stars: "37.4k",
    status: "Active",
    updated: "1d ago",
  },
  {
    owner: "tinyhttp",
    name: "tinyhttp",
    description: "Modern Express-like web framework. 0-legacy, tiny & fast.",
    language: "TypeScript",
    stars: "2.7k",
    status: "Active",
    updated: "6d ago",
  },
];

export const DigestPreview = () => (
  <div className="digest-preview">
    <div className="digest-chrome">
      <div className="digest-chrome-dots">
        <span />
        <span />
        <span />
      </div>
      <div className="digest-chrome-fields">
        <div className="digest-chrome-field">
          <span className="digest-chrome-label">From</span>
          <span className="digest-chrome-value">digest@restarred.dev</span>
        </div>
        <div className="digest-chrome-field">
          <span className="digest-chrome-label">Subject</span>
          <span className="digest-chrome-value">
            re:starred — tldraw/tldraw and 2 others
          </span>
        </div>
      </div>
    </div>
    <div className="digest-email">
      <div className="digest-header">
        <span className="digest-wordmark">re:starred</span>
        <span className="digest-date">
          Your weekly digest &middot;{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="digest-body">
        {repos.map((repo) => (
          <div className="digest-repo" key={`${repo.owner}/${repo.name}`}>
            <div className="digest-repo-top">
              <span className="digest-repo-name">
                {repo.owner}/{repo.name}
              </span>
              <span className="digest-repo-stars">&#9733; {repo.stars}</span>
            </div>
            <p className="digest-repo-desc">{repo.description}</p>
            <div className="digest-repo-meta">
              <span className="digest-repo-lang">{repo.language}</span>
              <span className="digest-repo-dot">&middot;</span>
              <span>{repo.status}</span>
              <span className="digest-repo-dot">&middot;</span>
              <span>Updated {repo.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

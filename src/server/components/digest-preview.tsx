const repos = [
  {
    owner: "facebook",
    name: "react",
    description: "The library for web and native user interfaces.",
    language: "TypeScript",
    stars: "228k",
    status: "Active",
    updated: "2d ago",
  },
  {
    owner: "sindresorhus",
    name: "awesome",
    description: "Awesome lists about all kinds of interesting topics.",
    language: "Markdown",
    stars: "312k",
    status: "Active",
    updated: "5d ago",
  },
  {
    owner: "denoland",
    name: "deno",
    description: "A modern runtime for JavaScript and TypeScript.",
    language: "Rust",
    stars: "98.2k",
    status: "Active",
    updated: "1d ago",
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
            Your weekly digest — 3 stars resurfaced
          </span>
        </div>
      </div>
    </div>
    <div className="digest-email">
      <div className="digest-header">
        <span className="digest-wordmark">re:starred</span>
        <span className="digest-date">
          Your weekly digest &middot; March 19, 2026
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

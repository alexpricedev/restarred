const repos = [
  {
    owner: "charmbracelet",
    name: "vhs",
    description: "Your CLI home video recorder.",
    language: "Go",
    stars: "19.1k",
    status: "Active",
    statusClass: "active",
    lastCommit: "Last commit 1 day ago",
    starredAgo: "2 years ago",
  },
  {
    owner: "mattdesl",
    name: "canvas-sketch",
    description:
      "A framework for making generative artwork in JavaScript and the browser.",
    language: "JavaScript",
    stars: "5.2k",
    status: "Dormant",
    statusClass: "dormant",
    lastCommit: "Last commit Feb 2024",
    starredAgo: "5 years ago",
  },
  {
    owner: "atom",
    name: "atom",
    description: "The hackable text editor.",
    language: "JavaScript",
    stars: "61k",
    status: "Archived",
    statusClass: "archived",
    lastCommit: "Last commit Jan 2023",
    starredAgo: "8 years ago",
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
            atom/atom and 2 others — from your stars
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
              <a
                className="digest-repo-name"
                href={`https://github.com/${repo.owner}/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {repo.owner}/{repo.name}
              </a>
              <span className="digest-repo-stars">&#9733; {repo.stars}</span>
            </div>
            <p className="digest-repo-desc">{repo.description}</p>
            <div className="digest-repo-meta">
              <span className="digest-repo-lang">{repo.language}</span>
              <span className="digest-repo-dot">&middot;</span>
              <span
                className={`digest-repo-badge digest-repo-badge--${repo.statusClass}`}
              >
                {repo.status}
              </span>
              <span className="digest-repo-dot">&middot;</span>
              <span>{repo.lastCommit}</span>
            </div>
            <div className="digest-repo-footer">
              <p className="digest-repo-starred">
                You starred this {repo.starredAgo}
              </p>
              <span className="digest-repo-unstar">Unstar</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

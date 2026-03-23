import type { SelectedRepo } from "../../services/digest-email";
import {
  formatRelativeDate,
  formatStarCount,
  getActivityStatus,
} from "../../services/digest-email";
import { ActivityBadge } from "./activity-badge";

interface RepoCardProps {
  repo: SelectedRepo;
  unstarUrl: string;
}

export const RepoCard = ({ repo, unstarUrl }: RepoCardProps) => {
  const activity = getActivityStatus(repo.lastActivityAt, repo.isArchived);

  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ marginBottom: "16px" }}
    >
      <tr>
        <td
          style={{
            backgroundColor: "#f3f3f4",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <a
            href={repo.htmlUrl}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              color: "#000000",
              textDecoration: "none",
            }}
          >
            {repo.fullName}
          </a>

          {repo.description && (
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                color: "#5e5e5e",
                margin: "8px 0 12px",
              }}
            >
              {repo.description}
            </p>
          )}

          <div style={{ margin: repo.description ? "0" : "12px 0 0" }}>
            {repo.language && (
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  color: "#5e5e5e",
                }}
              >
                {repo.language}
              </span>
            )}
            {repo.language && (
              <span style={{ margin: "0 8px", color: "#ababab" }}>
                &middot;
              </span>
            )}
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "#5e5e5e",
              }}
            >
              ★ {formatStarCount(repo.stargazersCount)}
            </span>
            <span style={{ margin: "0 8px", color: "#ababab" }}>&middot;</span>
            <ActivityBadge activity={activity} />
          </div>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#ababab",
              margin: "12px 0 0",
            }}
          >
            You starred this {formatRelativeDate(repo.starredAt)}
          </p>

          <a
            href={unstarUrl}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#ababab",
              textDecoration: "underline",
            }}
          >
            Unstar
          </a>
        </td>
      </tr>
    </table>
  );
};

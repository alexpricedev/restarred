import type { RepoActivity } from "../../services/digest-email";

interface ActivityBadgeProps {
  activity: RepoActivity;
}

const badgeBase = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "9999px",
  fontFamily: "Inter, sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  lineHeight: "16px",
};

export const ActivityBadge = ({ activity }: ActivityBadgeProps) => (
  <span>
    <span
      style={{
        ...badgeBase,
        backgroundColor: activity.badgeBg,
        color: activity.badgeColor,
      }}
    >
      {activity.label}
    </span>
    {activity.isArchived && (
      <span
        style={{
          ...badgeBase,
          backgroundColor: "#e6e6e6",
          color: "#5e5e5e",
          marginLeft: "6px",
        }}
      >
        Archived
      </span>
    )}
    {activity.detail && (
      <>
        <span style={{ margin: "0 8px", color: "#ababab" }}>&middot;</span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "#ababab",
            verticalAlign: "middle",
          }}
        >
          {activity.detail}
        </span>
      </>
    )}
  </span>
);

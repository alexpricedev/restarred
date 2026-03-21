import { Layout } from "@server/components/layouts";
import type { AdminStats } from "@server/services/analytics";
import type { RoleFilter } from "@server/services/events";
import type { User } from "@server/services/users";

const formatNumber = (n: number): string => n.toLocaleString("en-US");

const StatCard = (props: { label: string; value: string | number }) => (
  <div className="stat-card">
    <span className="stat-label">{props.label}</span>
    <span className="stat-value">
      {typeof props.value === "number"
        ? formatNumber(props.value)
        : props.value}
    </span>
  </div>
);

const StatSection = (props: { title: string; children: React.ReactNode }) => (
  <div className="stat-section">
    <h2 className="stat-section-title">{props.title}</h2>
    <div className="stat-grid">{props.children}</div>
  </div>
);

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "user", label: "Users" },
  { value: "admin", label: "Admins" },
  { value: "guest", label: "Guests" },
  { value: "all", label: "All" },
];

const RoleFilterNav = (props: { current: RoleFilter }) => (
  <nav className="role-filter">
    {ROLE_OPTIONS.map((option) => (
      <a
        key={option.value}
        href={
          option.value === "user" ? "/admin" : `/admin?role=${option.value}`
        }
        className={`role-filter-link${props.current === option.value ? " active" : ""}`}
      >
        {option.label}
      </a>
    ))}
  </nav>
);

export const AdminDashboard = (props: {
  stats: AdminStats;
  user: User | null;
  csrfToken?: string;
  roleFilter: RoleFilter;
}) => (
  <Layout
    title="Admin"
    name="admin"
    user={props.user}
    csrfToken={props.csrfToken}
  >
    <div className="admin-content">
      <div className="admin-header">
        <h1>Admin</h1>
        <RoleFilterNav current={props.roleFilter} />
      </div>

      <StatSection title="Users">
        <StatCard
          label="Lifetime signups"
          value={props.stats.lifetimeSignups}
        />
        <StatCard label="Current users" value={props.stats.totalUsers} />
        <StatCard label="Active users" value={props.stats.activeUsers} />
        <StatCard
          label="Signups this week"
          value={props.stats.signupsThisWeek}
        />
        <StatCard
          label="Signups this month"
          value={props.stats.signupsThisMonth}
        />
        <StatCard
          label="Account deletions"
          value={props.stats.accountDeletions}
        />
        <StatCard label="Unsubscribes" value={props.stats.unsubscribes} />
        <StatCard label="Resubscribes" value={props.stats.resubscribes} />
      </StatSection>

      <StatSection title="Engagement">
        <StatCard label="Total logins" value={props.stats.logins} />
        <StatCard label="Logins this week" value={props.stats.loginsThisWeek} />
        <StatCard label="Account views" value={props.stats.accountViews} />
        <StatCard
          label="Settings changes"
          value={props.stats.settingsChanges}
        />
        <StatCard label="Homepage views" value={props.stats.homepageViews} />
        <StatCard
          label="Homepage this week"
          value={props.stats.homepageViewsThisWeek}
        />
      </StatSection>

      <StatSection title="Digests">
        <StatCard label="Digests sent" value={props.stats.digestsSent} />
        <StatCard
          label="Digests this week"
          value={props.stats.digestsThisWeek}
        />
        <StatCard label="Digest failures" value={props.stats.digestFailures} />
      </StatSection>

      <StatSection title="Stars">
        <StatCard label="Stars synced" value={props.stats.totalStarsSynced} />
        <StatCard label="Sync failures" value={props.stats.starSyncFailures} />
      </StatSection>
    </div>
  </Layout>
);

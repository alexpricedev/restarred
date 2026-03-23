import { CsrfField } from "@server/components/csrf-field";
import { Flash } from "@server/components/flash";
import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface AccountProps {
  user: User;
  starCount: number;
  digestCount: number;
  csrfToken: string;
  logoutCsrfToken: string;
  testEmailCsrfToken?: string;
  resendCsrfToken?: string;
  pendingEmail?: string;
  flash?: { type: "success" | "error"; message: string };
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const COMMON_TIMEZONES: { group: string; zones: string[] }[] = [
  {
    group: "Americas",
    zones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "America/Toronto",
      "America/Vancouver",
      "America/Mexico_City",
      "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires",
    ],
  },
  {
    group: "Europe",
    zones: [
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Amsterdam",
      "Europe/Rome",
      "Europe/Madrid",
      "Europe/Stockholm",
      "Europe/Moscow",
    ],
  },
  {
    group: "Asia / Pacific",
    zones: [
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Bangkok",
      "Asia/Singapore",
      "Asia/Shanghai",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Pacific/Auckland",
    ],
  },
  {
    group: "Africa",
    zones: [
      "Africa/Lagos",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Nairobi",
    ],
  },
];

function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

function getNextDigestDate(user: User): string {
  if (!user.is_active) return "Paused";

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: user.timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
    weekday: "long",
  });

  const parts = formatter.formatToParts(now);
  const getCurrentPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const currentDayName = getCurrentPart("weekday");
  const currentHour = Number.parseInt(getCurrentPart("hour"), 10);
  const currentDayIndex = DAYS.indexOf(currentDayName);

  let daysUntil = user.digest_day - currentDayIndex;
  if (daysUntil < 0 || (daysUntil === 0 && currentHour >= user.digest_hour)) {
    daysUntil += 7;
  }

  const target = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: user.timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return `${dateFormatter.format(target)}, ${formatHour(user.digest_hour)}`;
}

function formatTimezone(tz: string): string {
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

export const Account = ({
  user,
  starCount,
  digestCount,
  csrfToken,
  logoutCsrfToken,
  testEmailCsrfToken,
  resendCsrfToken,
  pendingEmail,
  flash,
}: AccountProps) => (
  <Layout
    title="re:starred — Account"
    description="Manage your re:starred digest preferences — delivery day, frequency, and starred repos."
    name="account"
    user={user}
    csrfToken={logoutCsrfToken}
  >
    <div className="account-container">
      {!user.is_active && (
        <form method="POST" action="/account" className="account-paused-banner">
          <CsrfField token={csrfToken} />
          <input
            type="hidden"
            name="email_override"
            value={user.email_override ?? ""}
          />
          <input
            type="hidden"
            name="digest_day"
            value={String(user.digest_day)}
          />
          <input
            type="hidden"
            name="digest_hour"
            value={String(user.digest_hour)}
          />
          <input type="hidden" name="timezone" value={user.timezone} />
          <input
            type="hidden"
            name="filter_own_repos"
            value={String(user.filter_own_repos)}
          />
          <input type="hidden" name="is_active" value="true" />
          <p>
            Your weekly digest is paused. You won't receive any emails until you
            reactivate.
          </p>
          <button type="submit">Reactivate digest</button>
        </form>
      )}

      {flash && <Flash type={flash.type}>{flash.message}</Flash>}

      <div className="account-header">
        <div>
          <span className="account-label">ACCOUNT</span>
          <h1 className="account-heading">
            <a
              href={`https://github.com/${user.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="account-github-link"
            >
              {user.github_username}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="External link"
                role="img"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </a>
          </h1>
        </div>
      </div>

      <div className="account-stats">
        <div className="account-stat">
          <span className="account-stat-value">{starCount}</span>
          <span className="account-stat-label">Stars synced</span>
        </div>
        <div className="account-stat">
          <span className="account-stat-value">
            {digestCount > 0 ? digestCount : "\u2014"}
          </span>
          <span className="account-stat-label">Digests sent</span>
        </div>
        <div className="account-stat">
          <span className="account-stat-value">{getNextDigestDate(user)}</span>
          <span className="account-stat-label">Next digest</span>
        </div>
      </div>

      <form method="POST" action="/account" className="account-form">
        <CsrfField token={csrfToken} />

        <div className="account-section">
          <h2 className="account-section-heading">Delivery Email Address</h2>
          <p className="account-section-description">
            By default, digests are sent to your GitHub email. Set an override
            to use a different address.
          </p>
          {pendingEmail && (
            <div className="account-pending-verification">
              <p>
                Verification email sent to <strong>{pendingEmail}</strong>.
                Check your inbox to confirm.
              </p>
              {resendCsrfToken && (
                <form
                  method="POST"
                  action="/account/resend-verification"
                  className="account-resend-form"
                >
                  <CsrfField token={resendCsrfToken} />
                  <button type="submit" className="button-secondary">
                    Resend verification email
                  </button>
                </form>
              )}
            </div>
          )}
          <div className="form-field">
            <label htmlFor="email_override">Email address</label>
            <input
              type="email"
              id="email_override"
              name="email_override"
              placeholder={user.github_email}
              defaultValue={user.email_override ?? ""}
            />
          </div>
        </div>

        <div className="account-section">
          <h2 className="account-section-heading">Digest Schedule</h2>
          <p className="account-section-description">
            Choose when you'd like to receive your weekly digest of rediscovered
            stars.
          </p>
          <div className="account-schedule-grid">
            <div className="form-field">
              <label htmlFor="digest_day">Day</label>
              <select
                id="digest_day"
                name="digest_day"
                defaultValue={user.digest_day}
              >
                {DAYS.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="digest_hour">Time</label>
              <select
                id="digest_hour"
                name="digest_hour"
                defaultValue={user.digest_hour}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={formatHour(h)} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="timezone">Timezone</label>
            <select id="timezone" name="timezone" defaultValue={user.timezone}>
              {COMMON_TIMEZONES.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.zones.map((tz) => (
                    <option key={tz} value={tz}>
                      {formatTimezone(tz)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="account-section">
          <h2 className="account-section-heading">Own Repos</h2>
          <p className="account-section-description">
            Filter out repos you own from your digest — so you only rediscover
            other people's work.
          </p>
          <div className="account-toggle">
            <label className="account-radio">
              <input
                type="radio"
                name="filter_own_repos"
                value="true"
                defaultChecked={user.filter_own_repos}
              />
              Hide my repos
            </label>
            <label className="account-radio">
              <input
                type="radio"
                name="filter_own_repos"
                value="false"
                defaultChecked={!user.filter_own_repos}
              />
              Include my repos
            </label>
          </div>
        </div>

        <div className="account-section">
          <h2 className="account-section-heading">Digest Status</h2>
          <p className="account-section-description">
            When paused, no digests will be sent until you reactivate.
          </p>
          <div className="account-toggle">
            <label className="account-radio">
              <input
                type="radio"
                name="is_active"
                value="true"
                defaultChecked={user.is_active}
              />
              Active
            </label>
            <label className="account-radio">
              <input
                type="radio"
                name="is_active"
                value="false"
                defaultChecked={!user.is_active}
              />
              Paused
            </label>
          </div>
        </div>

        <div className="account-form-footer">
          <button type="submit">Save preferences</button>
          <span id="unsaved-indicator" className="account-unsaved" hidden>
            Unsaved changes
          </span>
        </div>
      </form>

      {testEmailCsrfToken && (
        <form
          method="POST"
          action="/account/test-email"
          className="account-test-email"
        >
          <CsrfField token={testEmailCsrfToken} />
          <div className="account-section">
            <h2 className="account-section-heading">Test Email</h2>
            <p className="account-section-description">
              Send a test digest email to{" "}
              {user.email_override || user.github_email} using 3 randomly
              selected repos from your stars.
            </p>
            <button type="submit" className="button-secondary">
              Send test email
            </button>
          </div>
        </form>
      )}

      <div className="account-danger-zone">
        <span className="danger-zone-label">DANGER ZONE</span>
        <h2 className="danger-zone-heading">Delete Account</h2>
        <p className="danger-zone-description">
          Permanently delete your account and all associated data. This cannot
          be undone.
        </p>
        <a href="/account/delete" className="danger-zone-link">
          Delete my account
        </a>
      </div>
    </div>
  </Layout>
);

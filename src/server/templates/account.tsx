import { CsrfField } from "@server/components/csrf-field";
import { Flash } from "@server/components/flash";
import { Layout } from "@server/components/layouts";
import type { User } from "@server/services/users";

interface AccountProps {
  user: User;
  starCount: number;
  csrfToken: string;
  logoutCsrfToken: string;
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
  csrfToken,
  logoutCsrfToken,
  flash,
}: AccountProps) => (
  <Layout
    title="restarred — Account"
    name="account"
    user={user}
    csrfToken={logoutCsrfToken}
  >
    <div className="account-container">
      <div className="account-header">
        <div>
          <span className="account-label">ACCOUNT</span>
          <h1 className="account-heading">{user.github_username}</h1>
        </div>
        <form method="POST" action="/auth/logout" className="account-logout">
          <CsrfField token={logoutCsrfToken} />
          <button type="submit" className="btn-ghost">
            Sign out
          </button>
        </form>
      </div>

      <div className="account-stats">
        <div className="account-stat">
          <span className="account-stat-value">{starCount}</span>
          <span className="account-stat-label">Stars synced</span>
        </div>
        <div className="account-stat">
          <span className="account-stat-value">&mdash;</span>
          <span className="account-stat-label">Digests sent</span>
        </div>
        <div className="account-stat">
          <span className="account-stat-value">{getNextDigestDate(user)}</span>
          <span className="account-stat-label">Next digest</span>
        </div>
      </div>

      {flash && <Flash type={flash.type}>{flash.message}</Flash>}

      <form method="POST" action="/account" className="account-form">
        <CsrfField token={csrfToken} />

        <div className="account-section">
          <h2 className="account-section-heading">Delivery Email</h2>
          <p className="account-section-description">
            By default, digests are sent to your GitHub email. Set an override
            to use a different address.
          </p>
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
          <h2 className="account-section-heading">Digest Status</h2>
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
          <p className="account-section-description">
            When paused, no digests will be sent until you reactivate.
          </p>
        </div>

        <button type="submit">Save preferences</button>
      </form>
    </div>
  </Layout>
);

# Restarred — GitHub Star Rediscovery Digest

> A microservice that emails you 3 forgotten GitHub stars every week, so good repos don’t disappear into the void.

-----

## Branding

- **Name**: restarred
- **Logo lockup**: `re:` as the mark, `starred` as the wordmark — e.g. **re:**starred
- **Concept**: Plays on “re-starred” (revisiting your stars) and “re: starred” (like an email subject line about your stars). The `re:` prefix reinforces the email-native nature of the product.
- **Tone**: Developer-friendly, minimal, slightly dry humour. Not corporate.

-----

## Overview

Most developers star GitHub repos and never look at them again. restarred resurfaces those stars as a weekly email digest — 3 random repos per week, cycling through your entire star list before repeating.

Built on the [Billet](https://github.com/alexpricedev/Billet) stack (Bun, PostgreSQL, server-rendered JSX). The repo has been set up and the start prompt ran so we should be ready to go.

-----

## Core Behaviour

- Once per week, each user receives an email containing 3 randomly selected repos from their GitHub stars
- The system tracks which repos have already been sent to each user
- No repo is repeated until the user has cycled through their entire star list
- Once all stars have been shown, the cycle resets and begins again
- If a user has fewer than 3 unseen stars remaining in a cycle, send whatever is left and reset

-----

## Users & Authentication

### GitHub OAuth

- Users sign up and log in via GitHub OAuth
- On first login, the service fetches and stores the user’s starred repos
- The GitHub token is stored securely for periodic re-syncing of stars
- Scopes required: `read:user`, `user:email` (stars are public by default; no extra scope needed for public stars)

### Account Lifecycle

- **Sign up**: GitHub OAuth → fetch stars → schedule first digest
- **Ongoing**: Weekly digest email + periodic star re-sync
- **Deletion**: User can delete their account and all associated data via the web UI

-----

## Data Model

### Users

|Field          |Type     |Notes                                                                   |
|---------------|---------|------------------------------------------------------------------------|
|id             |UUID     |Primary key                                                             |
|github_id      |INTEGER  |Unique, from GitHub                                                     |
|github_username|TEXT     |Display purposes                                                        |
|github_email   |TEXT     |Primary email from GitHub                                               |
|email_override |TEXT     |Nullable — user-set delivery address, takes priority over github_email  |
|github_token   |TEXT     |Encrypted, for API access                                               |
|digest_day     |INTEGER  |Day of week (0=Mon, 6=Sun). Default: 0 (Monday)                         |
|digest_hour    |INTEGER  |Hour of day (0–23). Default: 8                                          |
|timezone       |TEXT     |IANA timezone string (e.g. `Europe/London`). Default: detected at signup|
|is_active      |BOOLEAN  |Whether digests are enabled. Default: true                              |
|created_at     |TIMESTAMP|                                                                        |
|updated_at     |TIMESTAMP|                                                                        |

### Stars

|Field           |Type     |Notes                                    |
|----------------|---------|-----------------------------------------|
|id              |UUID     |Primary key                              |
|user_id         |UUID     |FK → users                               |
|github_repo_id  |INTEGER  |GitHub’s repo ID                         |
|repo_full_name  |TEXT     |e.g. `owner/repo`                        |
|repo_description|TEXT     |Nullable                                 |
|repo_url        |TEXT     |HTML URL                                 |
|repo_language   |TEXT     |Primary language, nullable               |
|repo_stars_count|INTEGER  |Stargazer count                          |
|last_commit_at  |TIMESTAMP|Latest commit date, nullable             |
|is_archived     |BOOLEAN  |Whether GitHub marks the repo as archived|
|starred_at      |TIMESTAMP|When the user starred it                 |

### Digest History

|Field  |Type     |Notes                                         |
|-------|---------|----------------------------------------------|
|id     |UUID     |Primary key                                   |
|user_id|UUID     |FK → users                                    |
|star_id|UUID     |FK → stars                                    |
|cycle  |INTEGER  |Which cycle (1 = first pass, 2 = second, etc.)|
|sent_at|TIMESTAMP|When the digest was sent                      |

-----

## Star Syncing

- **Initial sync**: On first login, fetch all starred repos via GitHub API (paginated, up to 100 per page)
- **Periodic re-sync**: Before each weekly digest, re-sync the user’s stars
  - Add any newly starred repos
  - Remove any unstarred repos (and their digest history)
  - Update metadata (description, star count, last commit date, language) for existing entries
- **Rate limiting**: Respect GitHub API rate limits (5,000 req/hr for authenticated users). Stagger syncs across users if needed

-----

## Digest Selection Algorithm

```
1. Get all star IDs for the user
2. Get all star IDs already sent in the current cycle
3. Unseen = all stars − already sent
4. If unseen count < 3:
   a. Pick all remaining unseen stars
   b. Increment the cycle number
   c. Pick (3 − remaining) from the full star list (new cycle)
5. Else: randomly pick 3 from unseen
6. Record selections in digest_history with current cycle number
7. Send email
```

-----

## Email

### Format

- HTML email with plain text fallback
- Inline CSS (no external stylesheets — email clients strip them)

### Content Per Repo (Rich Card)

- **Repo name** (linked) — `owner/repo`
- **Description** — from GitHub
- **Primary language** — with colour dot if possible
- **Star count** — current stargazer count
- **Activity status** — derived from `last_commit_at`:
  - “Active” (committed within last 3 months)
  - “Quiet” (3–12 months)
  - “Dormant” (12+ months)
  - “Archived” (if `is_archived` is true — shown as a visual tag alongside any activity status)
- **When you starred it** — relative or absolute date
- **Link to view** — Direct Github link

### Subject Line

Leans into the `re:` branding:

```
re:starred — mass-effect-3-ending-fixer and 2 others
```

Uses the repo name (not `owner/repo`) of one of the 3 repos, picked at random or by highest star count.

### Footer

- Link to manage preferences / account on the web UI
- Unsubscribe link (one-click, required for email deliverability)

### Sending

- Use a transactional email service (Resend)
- Send from a custom domain for deliverability
- Include `List-Unsubscribe` header

-----

## Web UI

Minimal server-rendered pages. No SPA, no dashboard — just the essentials.

### Pages

- **Landing page** — what it does, sign up with GitHub button
- **Account page** (authenticated) — shows:
  - Email address (from GitHub, with option to override for delivery)
  - Digest schedule: pick day of week and hour (on the hour only), with timezone
  - Total stars tracked
  - Current cycle progress (e.g. “142 of 312 stars seen”)
  - Next digest date
  - Pause/resume digests toggle
- **Account deletion** — confirmation flow, deletes all user data
- **Unsubscribe** — token-based, no login required
- **Contact / about** — static info (just derived form alexprice.dev for now)

-----

## Scheduled Jobs

| Job                      | Schedule                | Description                                                                                                                  |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Digest dispatcher        | Every hour, on the hour | Check for users whose `digest_day` + `digest_hour` (in their timezone) matches now. For each: sync stars, pick 3, send email |
| Cleanup expired sessions | Daily                   | Housekeeping                                                                                                                 |
|                          |                         |                                                                                                                              |

-----

## Technical Notes

### Stack

- **Runtime**: Bun
- **Database**: PostgreSQL (via Bun.SQL tagged templates)
- **Auth**: GitHub OAuth (Billet already has session management, CSRF, etc.)
- **Email**: via Resend
- **Templating**: Server-rendered JSX (Billet pattern)
- **Hosting**: Railway

### Environment Variables

```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=
ENCRYPTION_KEY=          # For encrypting GitHub tokens at rest
```

-----

## Out of Scope (V1)

These are deliberately excluded from the first version but noted for future consideration:

- Configurable repos-per-digest count
- Configurable frequency (daily, twice-weekly, etc.)
- Topic/language filtering
- “Snooze” or “skip” individual repos
- Star categorisation or tagging
- Public profile / sharing
- Mobile app or push notifications
- Analytics dashboard
- Private repo stars (would require `repo` scope)

-----

## Additional Context

1. **Private repos**: Public stars only. No `repo` scope requested. Keeps permissions minimal.
2. **Digest timing**: Configurable per-user. User picks day of week + hour (on the hour). Timezone detected at signup, editable. Default: Monday 08:00 in user’s timezone.
3. **Data model**: Flat stars-per-user (not normalised repos table). Simpler for V1, revisit if user count grows significantly.

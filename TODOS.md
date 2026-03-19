# TODOS

## MVP — Core Features

### ~~GitHub OAuth~~
~~Replace magic link auth with GitHub login (client ID/secret, OAuth redirect/callback, encrypted token storage, `user:email` scope). Migration drops `user_tokens` and `project` tables, adds `github_id`, `github_username`, `github_email`, `github_token`, digest preference columns to `users`.~~
**Status:** Done.

### ~~Star syncing~~
~~Fetch the authenticated user's starred repos via GitHub API (`GET /user/starred`, paginated) on first login and store in a `stars` table. Fields: `repo_id`, `full_name`, `description`, `language`, `stargazers_count`, `html_url`, `starred_at`, `last_activity_at`. GitHub returns up to 100 per page — need to paginate until empty. Re-sync on subsequent logins to pick up new stars and prune unstarred repos. Rate limit: 5000 req/hr with OAuth token, so even 10k stars only needs 100 pages.~~
**Status:** Done.

### ~~Digest selection algorithm~~
~~Pick 3 repos the user hasn't seen recently. Track selections in a `digest_history` table (`user_id`, `star_id`, `sent_at`). Selection criteria: exclude repos sent in the last 90 days, prefer repos with recent activity (commits in last 6 months), randomize within that pool. If fewer than 3 eligible repos remain, reset the history window. Pure service function — no UI, consumed by the digest job.~~
**Status:** Done.

### Digest email template
HTML email with 3 repo cards. Each card: repo name (linked), description, primary language badge, star count, last commit date, and an activity indicator (active/stale/archived). Inline CSS only (email client compatibility). Includes unsubscribe link in footer. Matches the Editorial Precision design system — light background, Space Grotesk headings, clean layout. Rendered server-side with JSX, sent via transactional email service.
**Depends on:** Digest selection algorithm (needs selected repos as input). Design system for email layout.

### ~~Account page~~
~~Authenticated page at `/account` showing: GitHub username, star count, digest schedule (day-of-week + hour picker), timezone selector, pause/resume toggle, and sign-out button. All preferences saved to `users` table columns (`digest_day`, `digest_hour`, `timezone`, `is_active`). Form submissions via POST with CSRF protection. No client-side JS required — server-rendered form with flash messages on save.~~
**Status:** Done.

### Job queue
Background job system for scheduled work. Two job types initially: `sync_stars` (re-fetch user's stars before each digest) and `send_digest` (select repos + render + send email). Hourly dispatcher checks which users are due a digest based on their `digest_day`, `digest_hour`, and `timezone`. Jobs table: `id`, `type`, `user_id`, `status` (pending/running/failed/completed), `attempts`, `max_attempts`, `run_at`, `started_at`, `completed_at`, `error`. Simple polling loop — no external queue dependency.
**Depends on:** Star syncing, digest selection, digest email template (all three are consumed by the job).

### Unsubscribe flow
Token-based one-click unsubscribe, no login required. Each digest email includes an unsubscribe link with a signed token (`/unsubscribe?token=...`). Token encodes user ID + HMAC signature using `CRYPTO_PEPPER`. GET request shows confirmation page, POST sets `is_active = false` on the user. Also include `List-Unsubscribe` and `List-Unsubscribe-Post` headers in digest emails for native email client support (RFC 8058).
**Depends on:** Digest email template (link goes in the email footer). Account page (user can re-subscribe from account settings).

## Post-MVP

### Job queue monitoring / dead letter handling
Add visibility into failed jobs — either an admin page showing failed jobs, or logging/alerting when a job exceeds max retries. The job queue silently marks jobs as 'failed' after max retries. Without monitoring, you won't know if star syncs or digest sends are failing. For V1 with just you as the user, checking the `jobs` table via psql is fine. Before inviting others, you need monitoring.
**Depends on:** Job queue being built.

### Account deletion flow
Full account deletion: confirmation page, delete all user data (stars, digest_history, sessions, user record), clear session cookie. Database should use `ON DELETE CASCADE` for all user-owned tables — so the actual deletion is just `DELETE FROM users WHERE id = ?`. UI needs a confirmation step.
**Depends on:** Account page existing.

### Email dark mode support
Add `@media (prefers-color-scheme: dark)` overrides to the digest email template. Without this, email clients that force dark mode (Apple Mail, Gmail app) will invert colors unpredictably — black text can become invisible. The Editorial Precision email is designed light-first; dark mode support means adding meta tags and CSS overrides for an inverted palette. Some email clients ignore `prefers-color-scheme` anyway, so this is polish, not critical.
**Depends on:** Digest email template being built.

## V2 Features

### AI repo summaries in digest emails
Enrich each digest repo card with an AI-generated summary: what the repo is good for and why it might still be relevant to you. Transforms "here are 3 repos" into "here's why these still matter." Could use Claude API to summarize READMEs. Runs as part of the digest job (after selection, before email rendering). Cost per digest: ~$0.01-0.05 for 3 API calls.
**Depends on:** Digest system working end-to-end.

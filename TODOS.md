# TODOS

## Post-MVP

### Remove dead magic link code
Remove `createMagicLink()`, `verifyMagicLink()`, magic link email template from `email.ts`, and drop the `user_tokens` table. After GitHub OAuth ships, this code is dead weight — it doesn't interfere with anything but creates confusion about which auth flow is active. Requires a migration to drop the table. Best done as a follow-up PR after MVP is confirmed working.
**Depends on:** GitHub OAuth fully working and tested.

### Job queue monitoring / dead letter handling
Add visibility into failed jobs — either an admin page showing failed jobs, or logging/alerting when a job exceeds max retries. The job queue silently marks jobs as 'failed' after max retries. Without monitoring, you won't know if star syncs or digest sends are failing. For V1 with just you as the user, checking the `jobs` table via psql is fine. Before inviting others, you need monitoring.
**Depends on:** Job queue being built.

### Account deletion flow
Full account deletion: confirmation page, delete all user data (stars, digest_history, sessions, user record), clear session cookie. Required by PROMPT.md spec. Database already uses `ON DELETE CASCADE` for sessions. Stars and digest_history tables should do the same — so the actual deletion is just `DELETE FROM users WHERE id = ?`. UI needs a confirmation step.
**Depends on:** Account page existing.

### Email dark mode support
Add `@media (prefers-color-scheme: dark)` overrides to the digest email template. Without this, email clients that force dark mode (Apple Mail, Gmail app) will invert colors unpredictably — black text can become invisible. The Editorial Monolith email is designed light-first; dark mode support means adding meta tags and CSS overrides for an inverted palette. Some email clients ignore `prefers-color-scheme` anyway, so this is polish, not critical.
**Depends on:** Digest email template being built.

## V2 Features

### AI repo summaries in digest emails
Enrich each digest repo card with an AI-generated summary: what the repo is good for and why it might still be relevant to you. Transforms "here are 3 repos" into "here's why these still matter." Could use Claude API to summarize READMEs. Runs as part of the digest job (after selection, before email rendering). Cost per digest: ~$0.01-0.05 for 3 API calls.
**Depends on:** Digest system working end-to-end.

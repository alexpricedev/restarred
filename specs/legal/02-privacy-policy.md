# Privacy Policy — Draft Specification

## Overview

A Privacy Policy for **re:starred** covering GDPR (UK/EU), CAN-SPAM (US), CASL (Canada), and general data protection requirements. Operated by **INFINITE CHAPTERS LTD**.

The `/privacy` route already exists as a link in the site footer (`src/server/components/layouts.tsx`) but has no implementation yet.

## Data Inventory

### Personal Data Collected

| Data | Source | Purpose | Storage |
|------|--------|---------|---------|
| GitHub user ID | GitHub OAuth | Account identification | `users.github_id` (integer) |
| GitHub username | GitHub OAuth | Display name, profile link | `users.github_username` (text) |
| GitHub email | GitHub OAuth (`/user/emails`) | Digest delivery | `users.github_email` (text) |
| Email override | User input (account settings) | Alternative digest delivery | `users.email_override` (text, nullable) |
| GitHub OAuth token | GitHub OAuth | API access to starred repos | `users.github_token` (encrypted via AES-256-GCM) |

### Non-Personal / Functional Data

| Data | Source | Purpose | Storage |
|------|--------|---------|---------|
| Digest preferences | User input | Schedule digest delivery | `users.digest_day`, `digest_hour`, `timezone` |
| Starred repositories | GitHub API sync | Digest content | `stars` table (repo metadata only) |
| Digest history | System-generated | Avoid repeat recommendations | `digest_history` table |
| Session data | System-generated | Authentication | `sessions` table (hashed IDs, 30-day expiry) |
| CSRF tokens | System-generated | Security | `sessions.csrf_secret` |

### Analytics / Event Data

| Event Type | Data Captured | Contains PII? |
|------------|---------------|---------------|
| `signup` | role | No |
| `login` | role | No |
| `account_deletion` | role | No |
| `account_view` | role | No |
| `settings_changed` | role, field names changed | No |
| `digest_sent` | role | No |
| `digest_failed` | role | No |
| `unsubscribe` | role | No |
| `resubscribe` | role | No |
| `stars_synced` | role, star count | No |
| `star_sync_failed` | role | No |
| `homepage_view` | role (guest/user/admin) | No |

Events are stored in the `events` table with type, role, optional JSONB metadata, and timestamp. **No user IDs, emails, or IP addresses are stored in events.**

## Sections to Include

### 1. Identity and Contact Details

- Data controller: INFINITE CHAPTERS LTD
- Contact details (email, registered address)
- Country of incorporation: United Kingdom

### 2. What Data We Collect and Why

Cover each category from the data inventory above:

- **Account data**: GitHub ID, username, email — collected during OAuth to create and manage the account
- **Email address**: Used solely to deliver the weekly digest — either the GitHub profile email or a user-provided override
- **OAuth token**: Encrypted at rest (AES-256-GCM), used only to read starred repositories from the GitHub API, never shared
- **Starred repository data**: Synced from GitHub to generate digest content — repo names, descriptions, languages, star counts, URLs
- **Digest history**: Which repos have been included in past digests, to avoid repeats
- **Session data**: Hashed session IDs and CSRF tokens for authentication and security
- **Usage events**: Aggregated, anonymous event counts (no PII) for service monitoring

### 3. Lawful Basis for Processing (GDPR)

| Processing Activity | Lawful Basis |
|---------------------|--------------|
| Account creation via GitHub OAuth | Consent (user initiates OAuth flow) |
| Sending weekly digest emails | Legitimate interest (core service function) + consent |
| Storing encrypted OAuth token | Contract performance (required to deliver service) |
| Syncing starred repos | Contract performance (required to deliver service) |
| Anonymous event tracking | Legitimate interest (service monitoring) |
| Session management | Legitimate interest (security) |

### 4. Third-Party Services

| Service | Purpose | Data Shared | Privacy Policy |
|---------|---------|-------------|----------------|
| **GitHub** (Microsoft) | OAuth authentication, API access | OAuth code exchange, API requests for starred repos | https://docs.github.com/en/site-policy/privacy-policies |
| **Resend** | Email delivery | Recipient email, digest HTML content | https://resend.com/legal/privacy-policy |
| **Railway** | Application hosting | All application data (stored on Railway infrastructure) | https://railway.com/legal/privacy |
| **Google Fonts** | Typography (Space Grotesk, Inter, JetBrains Mono) | User's IP address (standard web font loading) | https://policies.google.com/privacy |

### 5. Data Retention

| Data | Retention Period |
|------|-----------------|
| User account data | Until user deletes account |
| Starred repositories | Until user deletes account |
| Digest history | Until user deletes account |
| Sessions | 30 days (automatic expiry) |
| Events | Indefinite (anonymous, no PII) |

### 6. Data Deletion

- Users can delete their account at any time via `/account/delete`
- Deletion is immediate and cascading:
  - User record deleted
  - All sessions deleted
  - All starred repo data deleted
  - All digest history deleted
- The service attempts to revoke the GitHub OAuth grant
- Anonymous event data is retained (contains no PII)

### 7. Cookies and Sessions

- **Session cookie**: HttpOnly, SameSite=Lax, Secure (in production), 30-day expiry
- **OAuth state cookie**: Temporary, used only during the GitHub OAuth flow, cleared immediately after
- **No third-party cookies**
- **No advertising cookies**
- **No analytics cookies** (analytics are server-side only)

### 8. Data Security

- GitHub OAuth tokens encrypted at rest using AES-256-GCM (`src/server/services/encryption.ts`)
- Session IDs protected with HMAC
- CSRF protection via synchronizer token pattern
- All traffic over HTTPS
- Database hosted on Railway's managed infrastructure

### 9. User Rights (GDPR)

- **Right of access**: Users can view all their data on the account page
- **Right to rectification**: Users can update their email override and preferences
- **Right to erasure**: Users can delete their account (immediate, full cascade)
- **Right to restrict processing**: Users can pause digests (`is_active` flag)
- **Right to data portability**: Stars are synced from GitHub (user already has the source data)
- **Right to object**: Users can unsubscribe or delete their account
- **Right to withdraw consent**: Users can disconnect at any time

### 10. Children's Privacy

- The service requires a GitHub account (minimum age 13)
- The service is not directed at children under 13

### 11. Marketing Claims Alignment

The landing page makes specific claims that the privacy policy should support:

- **"No tracking"**: Clarify this means no third-party tracking (Google Analytics, Facebook Pixel, etc.). Internal anonymous event counting exists for service monitoring only.
- **"Your data is never sold or used for training"**: Include this as an explicit commitment.
- **"No ads"**: Confirm no advertising or ad-related data collection.

### 12. International Transfers

- Data may be processed in countries where Railway and Resend operate
- GitHub is a US-based service (Microsoft)
- Address UK adequacy decisions / Standard Contractual Clauses as applicable

### 13. Changes to This Policy

- Users will be notified of material changes via email
- Policy will include a "Last updated" date

## Implementation Notes

- This document should be rendered as a page at `/privacy`
- See `specs/legal/06-legal-pages-implementation.md` for the route implementation spec
- **Must be reviewed by a solicitor** — especially the GDPR lawful basis section
- The "no tracking" claim on the homepage needs careful alignment with the event tracking that does exist

## Open Questions

- [ ] Does INFINITE CHAPTERS LTD have a Data Protection Officer (DPO)?
- [ ] Is the company registered with the ICO (UK Information Commissioner's Office)?
- [ ] What is the registered address for the privacy policy contact section?
- [ ] Should a cookie banner be added? (Likely not needed — no third-party/marketing cookies)
- [ ] Should the privacy policy be versioned with a changelog?

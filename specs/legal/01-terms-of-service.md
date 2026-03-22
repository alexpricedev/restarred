# Terms of Service — Draft Specification

## Overview

A Terms of Service (ToS) document for **re:starred** (operated by **INFINITE CHAPTERS LTD**). This document governs the relationship between the service and its users.

The `/terms` route already exists as a link in the site footer (`src/server/components/layouts.tsx`) but has no implementation yet.

## Key Facts About the Service

| Detail | Value |
|--------|-------|
| Service name | re:starred |
| URL | https://restarred.dev |
| Legal entity | INFINITE CHAPTERS LTD |
| Pricing | Free (forever, per marketing copy) |
| Authentication | GitHub OAuth (no signup form) |
| Core function | Weekly email digest of 3 randomly selected starred GitHub repos |
| Data access | Read-only access to user's public GitHub starred repos |
| Email provider | Resend |
| Hosting | Railway |

## Sections to Include

### 1. Acceptance of Terms

- By connecting their GitHub account, users agree to the Terms
- Users must be at least 13 years old (GitHub's minimum age requirement)
- If users do not agree, they should not connect their GitHub account

### 2. Description of Service

- re:starred is a free service that sends weekly email digests
- Each digest contains 3 randomly selected repositories from the user's GitHub stars
- The service syncs the user's starred repositories via the GitHub API
- The service is provided "as is" with no guarantees of uptime or availability

### 3. Account and Authentication

- Users authenticate exclusively via GitHub OAuth
- The service requests read-only access to public starred repositories
- The user's GitHub OAuth token is stored in encrypted form (`src/server/services/encryption.ts`)
- Users can delete their account at any time via `/account/delete`, which:
  - Deletes all user data (CASCADE: sessions, stars, digest history)
  - Attempts to revoke the GitHub OAuth grant via the GitHub API
  - Is immediate and irreversible

### 4. User Obligations

- Users must have a valid GitHub account
- Users must provide a valid email address (either via GitHub profile or email override)
- Users must not abuse the service (excessive API calls, automation, etc.)

### 5. Email Communications

- By using the service, users consent to receive weekly digest emails
- Digest emails are the core function of the service, not marketing
- Users can pause/unpause digests at any time via account settings (`is_active` flag)
- Every email includes a one-click unsubscribe link (RFC 8058 compliant)
- Users can also unsubscribe via account settings

### 6. Intellectual Property

- re:starred is open source (GitHub: `alexpricedev/restarred`)
- Repository data displayed in digests belongs to the respective repository owners
- The re:starred brand, design, and original code are owned by INFINITE CHAPTERS LTD

### 7. Limitation of Liability

- The service is provided free of charge with no warranty
- INFINITE CHAPTERS LTD is not liable for:
  - Service downtime or interruptions
  - Loss of data (starred repos, settings)
  - Inaccurate or outdated repository information
  - Actions taken based on digest content
- Maximum liability is limited to £0 (free service)

### 8. Termination

- Users can terminate their account at any time via account deletion
- INFINITE CHAPTERS LTD reserves the right to:
  - Suspend or terminate accounts for abuse
  - Discontinue the service with reasonable notice
  - Modify these terms with notice to active users

### 9. Changes to Terms

- INFINITE CHAPTERS LTD may update these terms
- Material changes will be communicated via email to active users
- Continued use after changes constitutes acceptance

### 10. Governing Law

- These terms are governed by the laws of England and Wales
- Disputes are subject to the exclusive jurisdiction of the courts of England and Wales

### 11. Contact

- Include contact information for INFINITE CHAPTERS LTD
- Reference the GitHub repository for technical issues

## Implementation Notes

- This document should be rendered as a page at `/terms`
- See `specs/legal/06-legal-pages-implementation.md` for the route implementation spec
- The content should be reviewed by a solicitor before going live
- Consider using a versioning scheme (e.g., "Last updated: March 2026")

## Open Questions

- [ ] Does INFINITE CHAPTERS LTD have a registered address to include?
- [ ] Should there be a separate "Acceptable Use Policy"?
- [ ] What is the notice period for service discontinuation?
- [ ] Should the terms reference the open-source licence?

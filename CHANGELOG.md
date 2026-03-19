# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-03-19

### Added
- Account page at `/account` for authenticated users to manage preferences
- User preference form with email override, digest schedule (day/hour), and timezone selection
- Digest status toggle (Active/Paused) with pill-button UI
- Unsaved changes indicator on account form
- GitHub profile link from username with external icon
- Custom radio buttons styled as pill buttons with checked state indication
- Account page JavaScript for unsaved changes detection
- Test coverage for account controller with authentication and CSRF validation
- Test coverage for auth redirect behavior

### Changed
- Redirected unauthenticated users to `/` (home) instead of `/login` (removed /login route)
- Input and select elements now have darker borders and increased padding
- Section headings doubled to 2.5rem for better visual hierarchy
- Radio button controls now display as interactive pill buttons
- Delivery email label changed to "Delivery Email Address"

### Fixed
- Form field label padding (13px left margin)
- SVG attribute camelCase compliance in JSX (strokeWidth, strokeLinecap, strokeLinejoin)
- Logout CSRF test expectations updated to match new redirect behavior
- Merge conflicts resolved between feature branch and main

## [1.0.2] - 2026-03-19

### Added
- Digest selection algorithm: Weekly digest picks 3 random forgotten starred repos, tracks history, and supports cycle wrapping
- `getDigestProgress` service: Returns progress info (repos seen/total in current cycle) for account page
- Database migration: `digest_history` table to track selected repos per user and cycle

### Fixed
- Structured logging and transaction support for digest selection

## [1.0.1] - 2026-03-19

### Fixed
- Prevent users with completed initial sync from re-landing on the `/welcome` page — they're now redirected to home immediately.

## [1.0.0] - 2026-03-16

### Added
- Initial public release: Full-stack TypeScript starter with Bun, server-side rendering, and design system
- GitHub star syncing with weekly digest emails
- Dark theme redesign with Editorial Precision aesthetic

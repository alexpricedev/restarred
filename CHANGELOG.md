# Changelog

All notable changes to this project will be documented in this file.

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

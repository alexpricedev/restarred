# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-03-20

### Added
- Canvas confetti animation on /first page load with auto-fade and resize cleanup
- Client-side form submission via fetch with success/error state transitions
- Fetch error handling: button resets on network failure or server error
- Success state UI with fade-out/fade-in CSS animations after digest send
- `getDigestCount` service function for querying digest history
- Real digest count displayed on account page (replaces static em-dash)
- `recordDigestSelections` call after sending first digest
- Client tests for first.ts covering submit, success, and error flows

### Changed
- /first page restyled with bold editorial design: larger headings, pill label, prominent CTA
- Account page filter_own_repos labels changed from "Hidden"/"Included" to "Hide my repos"/"Include my repos"
- Star count on /first page now uses `toLocaleString()` for number formatting

### Fixed
- CSS variable references in welcome.css (`--color-text-primary` → `--color-text`)
- Missing `first.css` import in global style.css entry point
- Resize event listener leak in confetti animation (now cleaned up when canvas removed)

## [1.0.4] - 2026-03-19

### Changed
- Navigation unified across landing and app pages using shared Layout component
- App page nav now matches landing page design with filled CTA buttons
- Account page nav displays with same width (1280px) as marketing landing page
- Account link shows underline indicator when on account page
- Save Preferences button now styled as primary green CTA with larger padding

### Fixed
- Removed duplicate nav implementations between landing and app pages
- Improved visual consistency between authentication buttons across all pages

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

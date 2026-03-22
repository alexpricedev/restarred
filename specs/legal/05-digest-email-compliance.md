# Digest Email Compliance — Implementation Spec

## Problem

The weekly digest emails need to meet legal requirements under CAN-SPAM (US), GDPR (UK/EU), and CASL (Canada). Several items may be missing or need verification.

## Compliance Checklist

### CAN-SPAM Act (US) Requirements

| Requirement | Status | Details |
|-------------|--------|---------|
| Don't use false or misleading header info | OK | From address is `process.env.FROM_EMAIL` / `process.env.FROM_NAME` |
| Don't use deceptive subject lines | OK | Subject: "re:starred — your weekly digest" |
| Identify the message as an ad | N/A | Digest emails are transactional (content the user requested), not ads |
| Include physical postal address | **MISSING** | No physical address in digest emails |
| Tell recipients how to opt out | OK | Unsubscribe link in email footer (`EmailFooter` component) |
| Honour opt-out requests promptly | OK | Unsubscribe is instant (sets `is_active = false`) |
| Monitor what others are doing on your behalf | N/A | No third-party senders |

### GDPR / UK GDPR Requirements

| Requirement | Status | Details |
|-------------|--------|---------|
| Lawful basis for sending | **NEEDS REVIEW** | See consent capture spec (`specs/legal/04-consent-capture.md`) |
| Easy unsubscribe mechanism | OK | One-click unsubscribe link + `List-Unsubscribe` header |
| Data controller identification | **PARTIAL** | Email says "re:starred" but doesn't mention INFINITE CHAPTERS LTD |
| Link to privacy policy | **MISSING** | No privacy policy link in digest emails |

### CASL (Canada) Requirements

| Requirement | Status | Details |
|-------------|--------|---------|
| Express consent before sending | **NEEDS REVIEW** | See consent capture spec (`specs/legal/04-consent-capture.md`) |
| Identify the sender | **PARTIAL** | Name present, physical address missing |
| Include unsubscribe mechanism | OK | Unsubscribe link present |
| Include physical mailing address | **MISSING** | Not in email footer |

## Required Changes

### 1. Add Physical Postal Address to Digest Emails

**File**: `src/server/components/email/email-footer.tsx`

Add the registered address of INFINITE CHAPTERS LTD to the email footer. This is required by CAN-SPAM (and recommended by CASL/GDPR).

```html
<p style="...">
  INFINITE CHAPTERS LTD
  [Registered Address Line 1]
  [Registered Address Line 2]
  [Postcode, Country]
</p>
```

**Option**: Use a PO Box or registered agent address if a home address is used for the company registration.

**Configuration**: The address should be stored in an environment variable (e.g., `COMPANY_ADDRESS`) so it can be updated without code changes.

### 2. Add Privacy Policy Link to Digest Emails

**File**: `src/server/components/email/email-footer.tsx`

Add a link to the privacy policy alongside the existing "Manage your digest" and "Unsubscribe" links:

```html
<a href="https://restarred.dev/privacy">Privacy Policy</a>
```

### 3. Add Company Name to Digest Emails

**File**: `src/server/components/email/email-footer.tsx`

Ensure the full legal entity name "INFINITE CHAPTERS LTD" appears in the email footer (not just "re:starred").

### 4. Verify Email Headers

**File**: `src/server/services/digest-email.tsx`

The digest email already includes RFC 8058 headers for one-click unsubscribe. Verify these are present and correct:

```
List-Unsubscribe: <https://restarred.dev/unsubscribe?token=...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

These headers allow email clients (Gmail, Apple Mail, etc.) to show a native unsubscribe button.

## Files to Modify

| File | Change |
|------|--------|
| `src/server/components/email/email-footer.tsx` | Add physical address, privacy link, company name |
| `.env` / `.env.example` | Add `COMPANY_ADDRESS` env var |

## Updated Email Footer Structure

```
─────────────────────────────────
Manage your digest  ·  Unsubscribe  ·  Privacy Policy

INFINITE CHAPTERS LTD
[Registered Address]
[Postcode, Country]

© 2026 INFINITE CHAPTERS LTD
─────────────────────────────────
```

## Testing

- Render the digest email template and verify:
  - Physical address is present
  - Privacy policy link points to `https://restarred.dev/privacy`
  - Company name "INFINITE CHAPTERS LTD" appears
  - Unsubscribe link is present and functional
  - `List-Unsubscribe` headers are set

## Open Questions

- [ ] What is the registered address for INFINITE CHAPTERS LTD?
- [ ] Should a PO Box or registered agent address be used instead of a home address?
- [ ] Should the `COMPANY_ADDRESS` be an env var or hardcoded (it won't change often)?

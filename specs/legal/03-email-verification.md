# Email Verification for Email Override — Implementation Spec

## Problem

When a user sets an `email_override` in account settings, the address is saved and used for digest delivery **without any verification**. This creates two risks:

1. **Sending emails to non-consenting recipients**: A user could enter someone else's email address, resulting in that person receiving unsolicited digest emails.
2. **Failed deliveries and sender reputation damage**: Typos or invalid addresses lead to bounced emails, which can harm the domain's sender reputation with Resend/email providers.

## Current Behaviour

**File**: `src/server/controllers/app/account.tsx` (lines 88–145)

When the account settings form is submitted:

1. `email_override` is extracted from form data
2. Validated with a regex (`EMAIL_REGEX`) and length check (max 254 chars)
3. Saved directly to the database via `updateUserPreferences()`
4. Immediately used as the digest delivery address (takes priority over `github_email`)

```
recipientEmail = user.email_override || user.github_email
```

There is **no confirmation step** between saving and using the override.

## Proposed Solution

### Flow

```
User enters email override → Save as "pending" → Send verification email
→ User clicks verification link → Mark as "verified" → Use for digests
```

### Database Changes

**New migration** (e.g., `010_email_verification.ts`):

```sql
ALTER TABLE users ADD COLUMN email_override_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires_at TIMESTAMPTZ;
```

Alternatively, keep it simpler with a separate `email_verifications` table:

```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Verification Token

- Generate a cryptographically random token (32 bytes, hex-encoded)
- Store a hash of the token in the database (not the raw token)
- Token expires after 24 hours
- One active verification per user at a time (new request replaces old)

### Verification Email

Send a simple transactional email to the **new** override address:

- **Subject**: "Verify your email for re:starred"
- **Body**: "Click this link to confirm your email address: `https://restarred.dev/verify-email?token=...`"
- **Expiry notice**: "This link expires in 24 hours."
- Use the existing `EmailService` and Resend provider

### Verification Endpoint

**New route**: `GET /verify-email?token=...`

1. Look up the token hash in `email_verifications`
2. Check expiry
3. If valid:
   - Update `users.email_override` to the verified email
   - Delete the verification record
   - Redirect to `/account` with a success flash message
4. If invalid/expired:
   - Render an error page with option to resend

### Account Settings Changes

**File**: `src/server/controllers/app/account.tsx`

When an email override is submitted:

1. Validate format and length (as now)
2. If the email is different from the current verified override:
   - Save the pending email to `email_verifications`
   - Send verification email
   - Show flash message: "We've sent a verification email to [address]. Please check your inbox."
   - **Do not** update `users.email_override` yet
3. If the email is cleared (empty string):
   - Clear `users.email_override` immediately (reverts to GitHub email)
   - Delete any pending verification

**File**: `src/server/templates/account.tsx`

- Show verification status next to the email override field:
  - If verified: show the current override address
  - If pending: show "Verification email sent to [address] — check your inbox" with a "Resend" option
  - If none: show the input field with GitHub email as placeholder

### Digest Sending Logic

**No change needed** — digests already use:
```
recipientEmail = user.email_override || user.github_email
```

Since `email_override` is only updated after verification, digests will continue going to the last verified address until the new one is confirmed.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/server/database/migrations/010_email_verification.ts` | Create — new table |
| `src/server/services/email-verification.ts` | Create — token generation, verification logic |
| `src/server/controllers/app/verify-email.tsx` | Create — GET handler for verification link |
| `src/server/controllers/app/account.tsx` | Modify — trigger verification flow instead of direct save |
| `src/server/templates/account.tsx` | Modify — show verification status |
| `src/server/routes/app.tsx` | Modify — add `/verify-email` route |
| `src/server/controllers/app/index.ts` | Modify — export new controller |

## Edge Cases

- User changes email override again before verifying → new verification replaces the old one
- Verification link clicked after account deletion → no user found, show generic error
- User clears override while verification is pending → cancel pending verification
- Multiple rapid submissions → rate limit verification emails (max 1 per 5 minutes)

## Testing

- Unit test the verification service (token generation, hashing, expiry)
- Controller test: submitting override triggers verification email (mock email service)
- Controller test: verification endpoint updates the override
- Controller test: expired tokens are rejected
- Controller test: clearing override cancels pending verification

## Open Questions

- [ ] Should the GitHub email also be verified? (Probably not — GitHub has already verified it)
- [ ] Rate limiting: how many verification emails per hour per user?
- [ ] Should there be a resend cooldown UI?

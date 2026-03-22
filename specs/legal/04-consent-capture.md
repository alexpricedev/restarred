# Consent Capture During Onboarding — Implementation Spec

## Problem

Currently, when a user connects via GitHub OAuth, they are immediately set up to receive weekly digest emails (`is_active` defaults to `true` in the database). There is no explicit step where the user consents to:

1. Receiving weekly digest emails
2. The Terms of Service
3. The Privacy Policy

This is a compliance gap for:

- **GDPR (UK/EU)**: Requires freely given, specific, informed, and unambiguous consent for email communications
- **CASL (Canada)**: Requires express consent before sending commercial electronic messages
- **CAN-SPAM (US)**: Less strict (allows opt-out model), but explicit consent is still best practice

## Current Onboarding Flow

```
Homepage → "CONNECT GITHUB" → GitHub OAuth → /auth/callback
→ (new user) → /welcome → (stars sync) → /first → (send digest or skip) → /account
→ (returning user) → /account
```

**Key files**:
- `src/server/controllers/auth/callback.ts` — creates user, redirects to `/welcome`
- `src/server/controllers/app/welcome.tsx` — waiting screen during star sync
- `src/server/controllers/app/first.tsx` — send first digest or skip
- `src/server/templates/first.tsx` — first digest UI

**Current database default** (`001_initial_setup.ts`):
```sql
is_active BOOLEAN NOT NULL DEFAULT true
```

The user starts receiving digests as soon as their scheduled time arrives after signup — no explicit consent captured.

## Proposed Solution

### Option A: Consent on the `/first` Page (Recommended)

The `/first` page already serves as a natural consent point — the user has just finished syncing their stars and is about to receive their first digest.

**Add to the `/first` template** (before the "Send my first digest" button):

```
By continuing, you agree to receive a weekly email digest and accept our
Terms of Service and Privacy Policy.

[ ] I agree to receive weekly digest emails from re:starred
    (you can unsubscribe at any time)

[SEND MY FIRST DIGEST NOW]     [I'll wait for my regular digest]
```

**Behaviour changes**:
- The "Send" and "Skip" buttons are disabled until the checkbox is checked
- Submitting either form records consent in the database
- If the user skips, digests are still enabled (they consented via checkbox) but no immediate email is sent

### Option B: Consent During OAuth (Before GitHub Redirect)

Add an interstitial page between clicking "CONNECT GITHUB" and redirecting to GitHub:

```
Before we connect your GitHub account:

[x] I agree to the Terms of Service and Privacy Policy
[x] I consent to receiving weekly digest emails

[CONTINUE TO GITHUB]
```

**Trade-off**: Adds friction before the user even sees the service. Option A is preferred because the user has already seen their stars synced and understands what they're signing up for.

### Option C: Consent Banner on Homepage

Less intrusive but weaker legally — a notice on the homepage:

```
By connecting your GitHub account, you agree to our Terms and Privacy Policy
and consent to receiving a weekly email digest.
```

**Trade-off**: Implied consent is weaker than explicit consent under GDPR. Not recommended as the sole mechanism.

## Recommended Implementation (Option A)

### Database Changes

**New migration** (e.g., `011_consent_tracking.ts`):

```sql
ALTER TABLE users ADD COLUMN consented_to_emails BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN consented_at TIMESTAMPTZ;
```

For existing users, backfill:
```sql
UPDATE users SET consented_to_emails = true, consented_at = created_at
WHERE is_active = true;
```

### Change: Default `is_active` to `false` for New Users

**Migration**:
```sql
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT false;
```

New users will not receive digests until they explicitly consent on the `/first` page.

### Template Changes

**File**: `src/server/templates/first.tsx`

Add before the action buttons:

```html
<div class="consent-section">
  <label class="consent-checkbox">
    <input type="checkbox" name="consent" required />
    <span>
      I agree to receive weekly digest emails from re:starred.
      You can <a href="/account">unsubscribe</a> at any time.
    </span>
  </label>
  <p class="consent-legal">
    By continuing, you accept our
    <a href="/terms" target="_blank">Terms of Service</a> and
    <a href="/privacy" target="_blank">Privacy Policy</a>.
  </p>
</div>
```

### Controller Changes

**File**: `src/server/controllers/app/first.tsx`

In the `handleSend` and `handleSkip` handlers:

1. Check that `consent` checkbox was submitted
2. Update the user: `consented_to_emails = true`, `consented_at = NOW()`, `is_active = true`
3. If consent is not given, re-render the page with an error

### Client-Side Changes

**File**: `src/client/pages/first.ts`

- Disable the submit buttons until the checkbox is checked
- Enable/disable via a change event listener on the checkbox

### Digest Sending Guard

**File**: `src/server/services/digest.ts` (or wherever digests are queued)

Add a guard: only send digests to users where `is_active = true AND consented_to_emails = true`.

This is a safety net — since `is_active` is only set to `true` after consent, it's technically redundant, but defence in depth is good practice.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/server/database/migrations/011_consent_tracking.ts` | Create — add consent columns, change default |
| `src/server/templates/first.tsx` | Modify — add consent checkbox and legal text |
| `src/server/controllers/app/first.tsx` | Modify — validate and record consent |
| `src/client/pages/first.ts` | Modify — disable buttons until consent checked |
| `src/server/services/users.ts` | Modify — add `updateConsent()` function |

## Edge Cases

- Returning users who signed up before consent tracking: backfill migration covers this
- User unchecks and re-checks: only the checkbox state at submission matters
- User navigates directly to `/account` without going through `/first`: the `has_viewed_first` flag already gates this, but ensure `is_active` stays `false` until consent is given
- User deletes account and re-signs up: fresh consent flow (new user record)

## Testing

- Controller test: submitting without consent returns error
- Controller test: submitting with consent updates `consented_to_emails` and `is_active`
- Template test: consent checkbox and legal links are present in rendered HTML
- Client test: buttons are disabled until checkbox is checked

## Open Questions

- [ ] Should consent be re-captured if terms/privacy policy are materially updated?
- [ ] Should the consent timestamp be shown to the user anywhere (e.g., account page)?
- [ ] Is a separate consent record table needed for audit purposes (vs. columns on users)?

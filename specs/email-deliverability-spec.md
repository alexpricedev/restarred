# Email Deliverability Spec

Goal: Get digest emails into Gmail's Primary inbox instead of Spam/Promotions.

## Current Setup

- **Provider**: Resend (via API)
- **From**: `digest@restarred.dev` / "re:starred"
- **Headers**: `List-Unsubscribe` and `List-Unsubscribe-Post` (RFC 8058) already set
- **Content**: HTML + plain text multipart, JSX-rendered server-side

## 1. DNS Authentication (Required)

All three records must be configured in the `restarred.dev` DNS zone. Resend provides the exact values in their dashboard under domain settings.

### SPF

Add a TXT record on `restarred.dev` that includes Resend's sending IPs:

```
v=spf1 include:send.resend.com -all
```

If there's an existing SPF record, merge the `include:` — SPF only allows one TXT record per domain.

### DKIM

Resend generates three CNAME records for DKIM signing. Add all three to DNS. They look like:

```
resend._domainkey.restarred.dev → CNAME → <value from Resend>
```

Until DKIM is verified, Resend sends on a shared domain which tanks reputation.

### DMARC

Add a TXT record on `_dmarc.restarred.dev`:

```
v=DMARC1; p=none; rua=mailto:dmarc@restarred.dev
```

Start with `p=none` (monitor mode). Once SPF and DKIM are passing consistently, tighten to `p=quarantine` or `p=reject`.

### Verification

- **Resend dashboard**: Shows verification status for each record
- **Google Postmaster Tools**: Register `restarred.dev` to monitor domain reputation, spam rate, and authentication results
- **Manual check**: Send a test email, open it in Gmail → three dots → "Show original" — SPF, DKIM, and DMARC should all say `PASS`

## 2. Domain Reputation & Warm-Up

New or low-volume sending domains start with no reputation. Gmail is especially aggressive with unknown senders.

### Actions

- **Start small**: If launching to many users, ramp up volume gradually (e.g., 50/day → 100 → 250 → 500)
- **Monitor bounce rate**: Keep hard bounces under 2%. Remove invalid addresses immediately
- **Monitor spam complaints**: Keep complaint rate under 0.1% (Google Postmaster Tools tracks this)
- **Consistent sending**: Weekly digests on a predictable schedule help build reputation
- **Dedicated IP** (optional, future): Only worth it at 50k+ emails/month. Below that, Resend's shared pool is fine as long as DKIM is verified

## 3. Content Signals That Affect Inbox Placement

Gmail's classifier separates Primary from Promotions based on structural signals in the email.

### What Pushes Toward Promotions

| Signal | Current Status | Notes |
|--------|---------------|-------|
| Heavy HTML structure (nested tables, complex layouts) | Present | Standard for email, hard to avoid entirely |
| Multiple links | 3 repo links + 2 footer links | Reasonable, don't increase |
| Marketing-style language ("Check out", "Don't miss") | Not present | Keep it conversational |
| Tracking pixels | Not present | Good — don't add any |
| Images / logos | Not present | Good — keep it text-only |
| `List-Unsubscribe` header | Present | Helps deliverability despite being a "bulk" signal |
| Link tracking / redirects | Not present | Good — Resend can add click tracking; keep it off |

### What Pushes Toward Primary

- **Plain, conversational tone**: Current copy ("Here are 3 repos from your stars worth revisiting") is good
- **Low link-to-text ratio**: Keep it
- **Reply-to address**: Set a real reply-to that accepts mail (even if it goes to a monitored inbox)
- **One-to-one feel**: The email already reads like a personal summary, not a newsletter blast

### Potential Improvements

1. **Add a Reply-To header**: Set `reply-to` to something like `hello@restarred.dev` — a real address. Gmail gives higher trust when recipients can reply
2. **Simplify HTML structure**: The current template uses nested tables (outer wrapper → content table → header table → repo card tables). This is standard email HTML, but fewer nesting levels = fewer "marketing" signals. Consider flattening where possible
3. **Avoid ALL CAPS in content**: The language label (e.g., "JAVASCRIPT") uses `text-transform: uppercase` — this is CSS-level so probably fine, but worth noting
4. **Keep subject lines personal**: Format like "folktale, NES.css, and 1 other — from your stars" rather than "Your Weekly Digest from re:starred!"

## 4. Resend-Specific Configuration

### In Resend Dashboard

- [ ] Verify `restarred.dev` domain (adds SPF + DKIM automatically)
- [ ] Disable click tracking (Settings → Tracking → disable)
- [ ] Disable open tracking / tracking pixels
- [ ] Check that sending region matches audience (US/EU)

### In Code

Consider adding a `Reply-To` header in the email send options:

```typescript
// In src/server/services/digest-email.tsx, renderDigestEmail()
headers: {
  "List-Unsubscribe": `<${unsubscribeUrl}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  "Reply-To": "hello@restarred.dev",
},
```

## 5. Monitoring Checklist

| Tool | What to check | Frequency |
|------|---------------|-----------|
| Google Postmaster Tools | Domain reputation, spam rate, auth results | Weekly |
| Resend dashboard | Bounce rate, delivery rate, complaints | After each send |
| Gmail "Show Original" | SPF/DKIM/DMARC pass/fail on test emails | After any DNS change |

## 6. Priority Order

1. **DNS auth (SPF/DKIM/DMARC)** — single biggest factor, do this first
2. **Verify domain in Resend** — enables authenticated sending
3. **Disable tracking in Resend** — removes invisible signals Gmail detects
4. **Register Google Postmaster Tools** — needed to monitor progress
5. **Add Reply-To header** — small code change, improves trust signal
6. **Warm up volume gradually** — relevant when scaling to more users

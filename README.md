# re:starred

3 of your GitHub stars, resurfaced in your inbox every week.

Most developers star GitHub repos and never look at them again. re:starred resurfaces those forgotten stars as a weekly email digest — 3 of your starred repos per week, cycling through your entire list before repeating. No repo is shown twice until you've seen them all.

https://restarred.dev

---

## How It Works

1. **Connect GitHub** — sign in with GitHub OAuth, we index your starred repos
2. **Weekly digest** — every week, our algorithm picks 3 repos you starred and forgot about
3. **Re-engage** — read the summary, check recent activity, decide if it stays or gets archived

---

## Support the development

I built re:starred to help developers rediscover the GitHub repos they once thought were worth remembering. It's free forever, open source, and has no ads. Every digest costs a fraction of a penny to send, but it adds up. If you've found a gem in your inbox, consider buying me a coffee to keep the emails flowing.

[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/alexpricedev)

---

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Database:** PostgreSQL via `Bun.SQL` (no ORM)
- **Auth:** GitHub OAuth with secure session management
- **Email:** Transactional email via [Resend](https://resend.com)
- **Templating:** Server-rendered JSX (not React — no client-side hydration)
- **Styling:** Hand-written CSS with custom properties, no Tailwind
- **Fonts:** Space Grotesk, Inter, JetBrains Mono (Google Fonts)
- **Hosting:** [Railway](https://railway.com)

---

## Quick Start

You'll need [Bun](https://bun.sh) and a local [PostgreSQL](https://www.postgresql.org/) instance running.

```bash
bun install
cp .env.example .env    # fill in your credentials
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) — migrations run automatically on startup.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CRYPTO_PEPPER` | Yes | Secret key for session tokens — run `bun run generate:pepper` |
| `APP_URL` | Yes | Public URL (e.g. `https://restarred.dev`) |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret |
| `GITHUB_CALLBACK_URL` | Yes | OAuth callback URL (e.g. `http://localhost:3000/auth/callback`) |
| `EMAIL_PROVIDER_API_KEY` | Yes | Resend API key for sending digests |
| `EMAIL_FROM_ADDRESS` | Yes | Sender address for digest emails |
| `ENCRYPTION_KEY` | Yes | Key for encrypting GitHub tokens at rest |
| `PORT` | No | Server port — defaults to `3000` |

---

## Development

### Commands

```bash
bun run dev              # Start dev server with hot reload
bun run test             # Run full test suite (238 tests)
bun run check            # Lint + typecheck (zero warnings enforced)
bun run migrate:status   # Show migration state
bun run migrate:create   # Create a new migration file
```

### Code Quality

- **Biome** linting with `--max-warnings 0` — no `any` types, no `console` statements
- **TypeScript** strict mode
- **Husky** pre-commit hooks run lint and typecheck before every commit
- Structured logging via `log.info()` / `log.warn()` / `log.error()` — no `console.*`

### Testing

Tests run against a real PostgreSQL database (configured via `.env.test`). No mocking the DB layer.

```bash
bun run test                               # all tests
bun run test:file src/server/services/...  # single file
```

---

## Project Structure

```
src/
├── client/                     # Browser-side code
│   ├── main.ts                 # Entry point — routes to page init functions
│   ├── style.css               # Global styles + CSS imports
│   ├── components/             # Shared component CSS
│   └── pages/                  # Page-specific JS + CSS (co-located)
│
├── server/
│   ├── main.ts                 # Server entry point
│   ├── routes/                 # URL → controller mapping
│   ├── controllers/            # Request handlers (app/, api/, auth/)
│   ├── templates/              # Full-page JSX templates
│   ├── components/             # Reusable server JSX components
│   ├── services/               # Business logic & data access
│   ├── middleware/             # Auth, CSRF, rate limiting
│   ├── utils/                  # Response helpers, crypto
│   └── database/              # Migrations + CLI
│
└── types/                      # Global TypeScript declarations
```

---

## Deploy

Single Bun process — no containers, no serverless adapters. Anywhere you can run `bun run start`, it works.

### Railway

A `railway.json` is included with build and start commands pre-configured.

1. Push to GitHub
2. Create a new Railway project and connect your repo
3. Add a PostgreSQL plugin — this auto-sets `DATABASE_URL`
4. Set the remaining environment variables
5. Deploy — migrations run automatically on startup

---

## License

MIT

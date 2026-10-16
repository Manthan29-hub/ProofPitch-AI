# ProofPitch AI

**Turn Website Problems Into Paying Clients.**

ProofPitch AI is an offline-friendly revenue workspace for freelancers and agencies. It audits public website HTML using deterministic checks, stores prospects and audit history in SQLite, prioritizes improvement opportunities, and gives the team a guided path from audit to proposal.

## Quick start

Requirements: Node.js 22 (see `.nvmrc`). No paid service or API key is required.

```bash
npm ci
make test
make build
npm run dev
```

Open http://localhost:3000. Enter a public HTTP(S) website URL. Live audit failures remain visible and do not create partial leads. For an offline rehearsal, explicitly select the named demo fixture; its provenance is persisted and excluded from real audit analytics. The local fix preview can re-check a missing meta description, but it never changes or claims to change the live website.

## Commands

- `make test` — typecheck and run the offline Node test suite.
- `make build` — compile the TypeScript server.
- `npm run dev` — start the app with the TypeScript runner.
- `npm start` — start the compiled server after `make build`.

## Configuration

Copy `.env.example` to `.env` only if you need to override the port or database path. The default SQLite file is local and ignored by git. Never commit credentials.

## Docker

```bash
docker build -t proofpitch-ai .
docker run --rm --network none proofpitch-ai npm test
docker run --rm --network none -p 3000:3000 -e DATABASE_PATH=/app/data/proofpitch.sqlite proofpitch-ai
```

For persistent Docker data, mount a local directory at `/app/data`.

## Safety and limitations

Audit requests accept only HTTP(S), reject credentials, localhost, private/link-local/metadata destinations, validate redirects, enforce timeouts and response limits, reject HTTP errors and non-HTML responses, and parse only returned HTML. The product does not scrape contacts or send outreach. AI-style recommendations are generated from observed deterministic findings; they are suggestions, not claims about business facts. Prices, revenue, and estimates must be supplied by the user before sending a proposal.

## Architecture

- Node.js + TypeScript HTTP server
- SQLite via `better-sqlite3`
- Static responsive HTML/CSS/JS frontend
- Offline Node test runner (`tsx --test`)

## Troubleshooting

- If port 3000 is busy, run `PORT=3100 npm run dev`.
- If a URL cannot be audited, verify it is public, uses HTTP(S), and responds within the timeout; use the offline fallback for demos.
- Delete the ignored `proofpitch.sqlite` file to reset local data.

# ProofPitch AI

**Turn Website Problems Into Paying Clients.**

ProofPitch AI is an offline-friendly revenue workspace for freelancers and agencies. It audits public website HTML using deterministic checks, stores prospects and audit history in SQLite, prioritizes improvement opportunities, and gives the team a guided path from audit to proposal.

## Quick start

Requirements: Node.js **22.23.0** (the version in `.nvmrc`). Node.js 24 is not currently a supported/tested runtime because `better-sqlite3` is a native module. No paid service or API key is required.

```bash
npm ci
make test
make build
npm run dev
```

Open http://localhost:3000. Enter a public HTTP(S) website URL. Live audit failures remain visible and do not create partial leads. For an offline rehearsal, explicitly select the named demo fixture; its provenance is persisted and excluded from real audit analytics. The local fix preview can re-check a missing meta description, but it never changes or claims to change the live website.

## Commands

### Windows setup

Using [nvm-windows](https://github.com/coreybutler/nvm-windows) is recommended:

```powershell
nvm install 22.23.0
nvm use 22.23.0
node --version
```

The final command should print `v22.23.0`. From PowerShell, perform a clean dependency installation:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm ci
npm run typecheck
npm test
```

`npm ci` uses the committed lockfile. Do not use `npm install` for the initial setup because it may change the lockfile. If using Git Bash or WSL, `make test` is equivalent to the npm checks above.


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
- If `better-sqlite3`, `prebuild-install`, or `node-gyp` fails during installation, check `node --version`. Switch to Node.js 22.23.0, remove `node_modules`, and rerun `npm ci`. Node.js 24 is not currently supported/tested for this project. If native compilation is still required on Windows, install Visual Studio Build Tools with the **Desktop development with C++** workload and Python, then retry the clean install.
- If a URL cannot be audited, verify it is public, uses HTTP(S), and responds within the timeout; explicitly select the named offline fixture for demos.
- Production audits resolve DNS once, reject unsafe answers, and connect through a validated-address lookup while preserving the original hostname for HTTP/TLS. Redirect destinations are independently revalidated. The injected fetch path is test-only; DNS-rebinding protection is claimed only for the production transport.
- Audit requests are rate-limited per client address by default to 10 requests per 60 seconds. Configure `AUDIT_RATE_LIMIT` and `AUDIT_RATE_WINDOW_MS` for local deployments.
- Delete the ignored `proofpitch.sqlite` file to reset local data.

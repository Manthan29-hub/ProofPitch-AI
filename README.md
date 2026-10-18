# ProofPitch AI

**Turn Website Problems Into Paying Clients.**

ProofPitch AI is an offline-friendly revenue workspace for freelancers and agencies. It audits public website HTML using deterministic checks, stores prospects and audit history in SQLite, prioritizes improvement opportunities, and gives the team a guided path from audit to proposal.

## Quick start

Requirements: Node.js **22.22.3** (the version in `.nvmrc`). Node.js 24 is not currently a supported/tested runtime because `better-sqlite3` is a native module. No paid service or API key is required.

```bash
npm ci
make test
make build
npm run dev
```

Open http://localhost:3000. On an empty database, choose **Create the local owner account** and bootstrap the local workspace. Later visits require the email/password session. Enter a public HTTP(S) website URL. Live audit failures remain visible and do not create partial leads. For an offline rehearsal, explicitly select the named demo fixture; its provenance is persisted and excluded from real audit analytics. The local fix preview can re-check a missing meta description, but it never changes or claims to change the live website.

## Commands

### Windows setup

Using [nvm-windows](https://github.com/coreybutler/nvm-windows) is recommended:

```powershell
nvm install 22.22.3
nvm use 22.22.3
node --version
```

The final command should print `v22.22.3`. From PowerShell, perform a clean dependency installation:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm ci
npm run typecheck
npm test
```

`npm ci` uses the committed lockfile. Do not use `npm install` for the initial setup because it may change the lockfile. If using Git Bash or WSL, `make test` is equivalent to the npm checks above. If Node is not on `PATH`, use the existing Node 22.22.3 installation or nvm-windows; do not copy native `node_modules` between Windows and Linux.


- `make test` — typecheck, run the offline Node test suite, and check frontend syntax.
- `make build` — compile the TypeScript server.
- `npm run test:frontend` — run `node --check public/app.js` directly.
- `npm run dev` — start the app with the TypeScript runner.
- `npm start` — start the compiled server after `make build`.

## Authentication and workspace scope

First-owner bootstrap is atomic and is available only when the database has no users and no legacy prospect data. Development may use the first-run form; production disables HTTP owner creation. Provision the first owner locally with `npm run provision:owner`, using its hidden password prompt, before starting the production server. Passwords are salted scrypt hashes; sessions are opaque, hashed tokens in SQLite with seven-day expiry, HttpOnly/SameSite cookies, logout revocation, login rate limiting, and same-origin checks for state-changing requests. Workspace APIs return `401` without a session and enforce the session's workspace on every prospect, audit, proof, analytics, preview, proposal, and pipeline operation.

This MVP does not implement email verification, password reset, MFA, SSO, public signup, invitations, or payment processing. Do not expose a deployment publicly until an operator has configured HTTPS, `APP_ORIGIN`, `COOKIE_SECURE=true`, and an explicit legacy-data migration policy. In production, missing or wrong Origin headers are rejected for cookie-authenticated mutations. Local development permits missing Origin only when no production origin is configured. Existing databases containing prospects but no users fail closed at bootstrap; make a disposable copy and assign ownership deliberately before using them.

For GitHub Codespaces development, the server derives the exact forwarded origin only when `CODESPACES=true`, `CODESPACE_NAME`, `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN`, and a valid `PORT` are present. This development-only exception is matched exactly for bootstrap, login, logout, and authenticated writes; production never derives or trusts a Codespaces origin. Arbitrary forwarded headers are not trusted.

## Configuration

`.env.example` documents configuration names. Current scripts do not load `.env` automatically; set variables in the process or container environment before startup. In PowerShell, use `$env:PORT="3000"` and `$env:DATABASE_PATH="./proofpitch.sqlite"`. The default SQLite file is local and ignored by git. Never commit credentials.

## Docker

```bash
docker build -t proofpitch-ai .
docker run --rm --network none -e NODE_ENV=development proofpitch-ai npm test
docker run --rm -p 127.0.0.1:3000:3000 -e NODE_ENV=development -v proofpitch-data:/app/data proofpitch-ai
```

The final command is a local HTTP rehearsal bound to loopback; production requires HTTPS and production cookies. Port publishing is separate from network-disabled testing. The image uses Node.js 22.22.3, runs as the non-root `node` user, creates `/app/data`, and includes a health check. The named Docker volume `proofpitch-data` preserves SQLite across container replacements; it is not a backup. The offline test command installs dependencies during image construction, then runs without network access.

### Operator provisioning and backup/restore

```bash
APP_ORIGIN=https://app.example.test NODE_ENV=production COOKIE_SECURE=true DATABASE_PATH=./data/proofpitch.sqlite npm run provision:owner
APP_ORIGIN=https://app.example.test NODE_ENV=production COOKIE_SECURE=true DATABASE_PATH=./data/proofpitch.sqlite npm start
npm run db:backup -- --source ./data/proofpitch.sqlite --destination ./backups/proofpitch.sqlite
npm run db:restore -- --source ./backups/proofpitch.sqlite --destination ./restore/proofpitch.sqlite
```

The backup tool uses SQLite's online backup API and verifies integrity and foreign keys. Restore into a disposable directory or volume first, inspect representative records, and replace a mounted volume only during planned maintenance. A persistent volume is not a backup. Keep one application instance for this SQLite release and do not trust arbitrary `X-Forwarded-*` headers.

## Safety and limitations

Audit requests accept only HTTP(S), reject credentials, localhost, private/link-local/metadata destinations, validate redirects, enforce timeouts and response limits, reject HTTP errors and non-HTML responses, and parse only returned HTML. The product does not scrape contacts or send outreach. AI-style recommendations are generated from observed deterministic findings; they are suggestions, not claims about business facts. Prices, revenue, and estimates must be supplied by the user before sending a proposal.

## Architecture

- Node.js + TypeScript HTTP server
- SQLite via `better-sqlite3`
- Explicit SQLite migrations with users, sessions, workspaces, memberships, audit-linked proofs, and proposal revisions
- Static responsive HTML/CSS/JS frontend
- Offline Node test runner (`tsx --test`)

## Troubleshooting

- If port 3000 is busy, run `PORT=3100 npm run dev`.
- If `better-sqlite3`, `prebuild-install`, or `node-gyp` fails during installation, check `node --version`. Switch to Node.js 22.22.3, remove `node_modules`, and rerun `npm ci`. Node.js 24 is not currently supported/tested for this project. If native compilation is still required on Windows, install Visual Studio Build Tools with the **Desktop development with C++** workload and Python, then retry the clean install.
- If a URL cannot be audited, verify it is public, uses HTTP(S), and responds within the timeout; explicitly select the named offline fixture for demos.
- Production audits resolve DNS once, reject unsafe answers, and connect through a validated-address lookup while preserving the original hostname for HTTP/TLS. Redirect destinations are independently revalidated. The injected fetch path is test-only; DNS-rebinding protection is claimed only for the production transport.
- Audit requests are rate-limited per client address by default to 10 requests per 60 seconds. Configure `AUDIT_RATE_LIMIT` and `AUDIT_RATE_WINDOW_MS` for local deployments.
- Delete the ignored `proofpitch.sqlite` file to reset local data.

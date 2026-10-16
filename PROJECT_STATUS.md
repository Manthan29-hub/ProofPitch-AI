# ProofPitch AI status

## Verified MVP
- Responsive dark graphite dashboard with turquoise/violet visual system and mobile navigation.
- Website audit workflow uses deterministic HTML parsing for title, description, H1s, links, images, alt text, word count, and prioritized recommendations.
- URL safety includes HTTP(S)-only validation, credential rejection, private/local host rejection, validated redirects, timeout, and response-size limits.
- SQLite persists prospects, audit history, pipeline transitions, analytics, and proposal inputs.
- API-first audit flow creates and updates prospects; unavailable live sites fall back to an explicitly labeled offline fixture.
- Proposal data is generated from stored audit evidence and the dashboard print action opens a printable proposal suitable for PDF export.
- No unsolicited messaging or contact scraping is implemented.
- Live failures remain errors; offline demos require explicit selection and persist `isDemo` provenance.
- Frontend untrusted data is rendered with text nodes, and proposal printing uses an in-page printable view.
- Added regression coverage for valid hostnames, mapped IPv6, HTTP/content-type failures, parser visibility, and demo/proposal persistence.

## Actual verification results
- `npm ci` — passed on Linux; 46 packages audited, 0 vulnerabilities reported.
- Supported runtime documented as Node.js 22.23.0; Node.js 24 is not claimed supported because `better-sqlite3` is native.
- `make test` — passed: TypeScript typecheck plus 11 offline Node tests.
- `make build` — passed: production TypeScript compilation.
- `node --check public/app.js` — passed.
- Runtime smoke test — passed: `/health`, static frontend serving, and offline audit API creation.
- Secret scan — passed: no `.env` private files, API keys, passwords, tokens, or credential assignments detected in tracked source.
- Git review — passed: two meaningful commits, clean working tree.

## Buildathon rebuildability checklist
- [x] Git repository with meaningful commits
- [x] `package-lock.json` dependency lockfile
- [x] Pinned runtime in `.nvmrc`
- [x] Dockerfile included
- [x] Single documented offline test command (`make test`)
- [x] README setup, run, test, Docker, configuration, and troubleshooting steps
- [x] Safe `.env.example` with placeholders only
- [x] Relative paths and ignored local database files
- [x] Tests independent of live external APIs
- [x] GitHub Actions CI workflow runs install, test, and build
- [x] Docker build/run verification for this change — GitHub Actions run 38935408411 passed the isolated test and health checks

## Remaining blockers / limitations
- Public GitHub repository: https://github.com/Manthan29-hub/ProofPitch-AI
- CI run 38935408411 passed tests, production build, Docker image build, complete tests inside `--network none`, and an internal offline container health check.
- Local Docker CLI is unavailable, but Docker verification completed successfully on the GitHub-hosted Linux runner.
- Authentication, team workspaces, branded white-label output, and payment infrastructure are intentionally outside this offline MVP.

## Current flow verification
- Explicit demo audit → evidence inspector → local missing-meta-description preview and re-check → selected prospect proposal → in-page print view are implemented and API-smoke-tested.
- Live failures remain errors; they do not silently become demo results.
- DNS lookup is injectable for offline tests. The current native `fetch` path still cannot guarantee DNS-rebinding resistance because it may resolve a hostname again at connection time; this is documented and not claimed as solved.

## Browser verification note
- The built-in browser could not open the local server in this environment, so desktop/mobile layout and browser console checks remain unverified. Static viewport/media-query inspection and API flow smoke tests passed.

## Visual QA attempt
- The worker server was started with `npm run dev` and verified locally: `GET /health` returned 200 and `/` returned 200.
- The built-in browser rendered a ProofPitch page at a 480px viewport, but its DOM showed stale persisted prospect rows that did not match the isolated worker database or current HTML response. This indicates the browser tab was not observing the same runtime/network namespace.
- Desktop viewport, browser console, and browser network failures remain unverified; no visual pass is claimed.
- Reproducible source fixes made during QA: removed external Google Fonts requests for offline cleanliness, made demo URL validation conditional, cleared static placeholder prospect rows, fixed tablet evidence grid behavior, fixed Escape print cleanup, and corrected table markup.

## Runtime and release notes
- Windows setup now documents nvm-windows, exact Node.js 22.23.0 selection, clean `npm ci`, and native `better-sqlite3` troubleshooting.
- No dependency versions were changed.
- Added deterministic coverage for fetch timeout, declared response size, content type, and redirect limits.
- DNS rebinding remains an explicit limitation: DNS answers are validated before native `fetch`, but the connection path does not pin the validated address.

## Phase 1 browser QA attempt (current checkout)
- Starting commit: `ecd9a1b`; starting and final source working tree were clean before documentation update.
- Isolated worker runtime: `DATABASE_PATH=/tmp/proofpitch-phase1-3000.sqlite PORT=3000 npm run dev`; worker `/health` and `/` returned HTTP 200, and worker analytics/prospects initially returned an empty workspace.
- Worker API verification passed for explicit demo with no URL, persisted `isDemo=true` and the fixed fixture URL, local preview re-check, selected-prospect proposal, empty live URL rejection, and invalid reserved-host failure without a new prospect.
- The built-in browser rendered a ProofPitch page at a 494px viewport, but its visible prospect rows did not match the isolated worker API, which returned zero prospects before the worker demo request. The browser was therefore stale or connected to a different local runtime/database.
- Desktop 1440x900 and tablet 768x1024 browser views were not verified. Browser console and network panels were not available through the supported controls. Full browser click-through, print-dialog inspection, and same-runtime persistence comparison are blocked by this namespace/data mismatch.
- `https://example.com` live audit was attempted only through the isolated worker; worker DNS resolution was unavailable and returned `Host could not be resolved`. No client website was contacted.

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
- Supported runtime documented as Node.js 22.22.3; Node.js 24 is not claimed supported because `better-sqlite3` is native.
- `npm ci` — passed on Linux; 46 packages installed/audited.
- `make test` — passed: TypeScript typecheck plus 14 offline Node tests.
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
- Branded white-label output, payment infrastructure, password recovery, MFA, SSO and invitations remain intentionally outside this local MVP.

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
- Windows setup now documents nvm-windows, exact Node.js 22.22.3 selection, clean `npm ci`, and native `better-sqlite3` troubleshooting.
- No dependency versions were changed.
- Added deterministic coverage for fetch timeout, declared response size, content type, and redirect limits.
- Phase 2 production transport now pins the validated DNS address through the Node HTTP(S) lookup callback while preserving the original hostname for Host/SNI; redirects repeat validation. The test-only injected fetch seam does not model socket pinning.

## Phase 1 browser QA attempt (current checkout)
- Starting commit: `ecd9a1b`; starting and final source working tree were clean before documentation update.
- Isolated worker runtime: `DATABASE_PATH=/tmp/proofpitch-phase1-3000.sqlite PORT=3000 npm run dev`; worker `/health` and `/` returned HTTP 200, and worker analytics/prospects initially returned an empty workspace.
- Worker API verification passed for explicit demo with no URL, persisted `isDemo=true` and the fixed fixture URL, local preview re-check, selected-prospect proposal, empty live URL rejection, and invalid reserved-host failure without a new prospect.
- The built-in browser rendered a ProofPitch page at a 494px viewport, but its visible prospect rows did not match the isolated worker API, which returned zero prospects before the worker demo request. The browser was therefore stale or connected to a different local runtime/database.
- Desktop 1440x900 and tablet 768x1024 browser views were not verified. Browser console and network panels were not available through the supported controls. Full browser click-through, print-dialog inspection, and same-runtime persistence comparison are blocked by this namespace/data mismatch.
- `https://example.com` live audit was attempted only through the isolated worker; worker DNS resolution was unavailable and returned `Host could not be resolved`. No client website was contacted.

## Phase 2 Security and Reliability
- `make test`, `make build`, `node --check public/app.js`, and `git diff --check` all passed after Phase 2 changes.
- Docker checks were blocked locally because `docker --version` returned `command not found`.
- Production audit fetch now connects only through the validated public DNS address, with original-hostname HTTP/TLS semantics preserved. Redirect targets are resolved and pinned independently.
- Added bounded per-client audit rate limiting with configurable `AUDIT_RATE_LIMIT` and `AUDIT_RATE_WINDOW_MS`; invalid configuration falls back to safe defaults.
- Added regression coverage for public IPv6, reserved/multicast ranges, rate limiting, timeout, response size, content type, redirects, and explicit demo/live URL behavior.
- No real customer websites or production databases were used for Phase 2 tests.

## Phase 1 browser QA follow-up (2026-10-17)
- The isolated app was opened in a fresh VS Code tunnel browser tab at port 3001; the dashboard showed LIVE DATA and the persisted ProofPitch demo fixture from the isolated database.
- Same-runtime browser workflows passed: explicit demo audit without a URL, findings and demo provenance, local preview re-check, selected-prospect proposal view and Escape close, empty live URL validation, and rejection of a localhost URL without creating a live prospect.
- Desktop visual review passed at the observed 1363x936 browser viewport. An earlier partial mobile rendering was observed at 494x707.
- Exact 1440x900, 768x1024, and 390x844 viewport checks remain unverified. The available browser control surface does not expose viewport resizing or browser DevTools console/network inspection, so those checks remain blocked.
- Phase 1 should not be marked fully complete until the exact viewport matrix and console/network inspection are completed.

## Phase 1 exact viewport QA attempt (current checkpoint)
- Starting commit: `177c9ae`; starting working tree contained a pre-existing `PROJECT_STATUS.md` modification and was not reset or discarded.
- Isolated server setup: `DATABASE_PATH=/tmp/proofpitch-phase1-current.sqlite PORT=3001 npm run dev`. After a platform-mismatched native dependency was repaired with a clean local `npm ci`, `/health` returned 200 and `/api/prospects` initially returned `[]`.
- Browser tab was opened at `http://localhost:3001/`; the browser rendered the app at an observed `494x707` viewport.
- Same-runtime proof failed: before the shell API demo request, the browser showed one persisted demo prospect and `proposal ready`, while shell `/api/prospects` returned empty. After a shell-created demo, shell state became one `audited` demo prospect but browser still showed the stale `proposal ready` row. The browser was therefore not connected to the same server/database namespace.
- Exact `1440x900`, `768x1024`, and `390x844` viewports could not be set with the supported browser controls. DevTools Console/Network inspection is not exposed by the available tool surface.
- Demo, preview, proposal, print, invalid-live, and localhost workflows were not claimed as browser passes because the browser runtime/data mismatch invalidated the end-to-end evidence. Equivalent isolated worker API checks remain covered by Phase 1/Phase 2 tests.
- No application defect was fixed in this attempt; the reproducible blocker is the browser/worker namespace mismatch plus unavailable exact viewport and DevTools controls.

## Phase 1 application browser QA closure (2026-10-17)
- Starting checkout: 663a5d6, clean, ahead 4. Used the existing isolated Windows port-3001 runtime through its VS Code forwarded URL; PowerShell API and browser after reload matched fixture d33c3035-b4f6-413c-a4f5-90b9410b0ddb, status proposal_ready, count 1. The Linux worker localhost from earlier attempts was a different namespace.
- Exact CSS viewport checks passed at 1440x900, 768x1024, and 390x844 using a temporary same-origin iframe harness. Native browser dimensions were not changed; this is responsive CSS viewport QA, not physical-device or top-level device emulation. No page-level horizontal overflow; wide tables use the existing .table-scroll container. Inspected navigation, metrics, form, evidence, prospects, proof library and proposal views.
- Reproduced and fixed an application defect: Open proposal displayed a normal-flow section below the dashboard, off-screen. Screen-only CSS now opens a fixed scrollable overlay at x=0,y=0 with the viewport dimensions; mobile padding is reduced. Open, Back to workspace, and Escape were verified after the fix. Print-media CSS remains separate.
- Browser flows passed: mobile navigation, explicit demo without URL, observed findings/demo provenance, local meta-description preview/re-check, selected-prospect proposal, empty live URL native validation, and private-host rejection. Invalid live input left one demo prospect and no extra live prospect.
- Browser console capture found no application warnings/errors; older chrome-extension metadata errors were unrelated. Network evidence came from the iframe PerformanceResourceTiming responseStatus and same-origin GET probes: CSS/JS, analytics/prospects, proposal and preview returned 200; demo audit returned 201; unsafe live audit returned expected 400. Native DevTools panels were not opened.
- Reusable harness: test/browser-qa.html. With an isolated app running, temporarily copy it to public/phase1-qa-temp.html and open that path on the same forwarded origin. Inspect refreshes API identity and resource statuses. Remove the public copy after QA; it was removed for this commit. Recorded results: test/phase1-browser-qa-result.json.
- Windows npm ci restored platform-local command shims after tsx/tsc were unavailable. Then 14 tests, typecheck, build, frontend syntax, inline QA-script syntax, and diff check passed.
- Phase 1 functional and responsive application QA is complete using the above diagnostics. Native OS print dialog/output, physical devices, and top-level device emulation were not tested or claimed. Earlier blocker entries remain as historical attempts and are superseded for the checks verified here.
- No customer website/data, production database, push or deployment used.

## Phase 2 follow-up gaps closed (2026-10-17)

- Pinned HTTP transport now supports the Node lookup callback contract for both scalar and all-address lookups; a local HTTP fixture exercises the production transport.
- The audit request deadline now includes initial and redirect DNS resolution.
- Audit rate limiting applies to both audit endpoints and refuses new client keys when the 10,000-entry in-memory table remains full after pruning expired entries.
- Address checks additionally block IPv4 192.88.99.0/24 and IPv6 100::/64, 2001:db8::/32, and 64:ff9b::/32.
- Four regression tests were added; all 18 tests pass, as do TypeScript typecheck, production build, frontend syntax, and diff checks.
- Earlier Docker verification was blocked while Docker Desktop was stopped; the current finalisation run started the engine and verified the image, offline suite and internal health.

## Phase 3 prospect workflow (2026-10-17)

- Prospect list and detail responses now include valid next pipeline stages and the latest saved audit context, including explicit live/demo provenance.
- The dashboard restores the selected prospect after refresh, reloads its evidence when selection changes, and shows distinct loading, empty, partial-data, and error states.
- Pipeline stage actions now use the server's transition rules and persist through the existing status endpoint; invalid transitions remain rejected.
- Prospect creation now deduplicates normalized websites, PATCH validates allowed fields and public websites, and missing audit resources return 404 rather than an ambiguous null response.
- Proposal generation always uses the latest saved audit context instead of stale saved proposal JSON, and the UI labels the selected prospect and proposal provenance.
- Added regression coverage for context/transition responses, prospect deduplication and PATCH validation, and latest-audit proposal context. Total offline tests: 21.
- Local verification passed with Node.js 22.22.3: `npm run typecheck`, `npm test`, `npm run build`, `node --check public/app.js`, and `git diff --check`. The Windows shell did not provide `make`, so the documented `make test` target was verified through its equivalent npm commands rather than invoked directly.
- No browser QA, commit, push, deployment, production database, or real customer website access was performed for this phase.

## Continuous completion checkpoint: Phases 1–8 (2026-10-17)

### Phase 1 — Core audit workflow

- **Implementation:** Complete. Deterministic audit, explicit named demo fixture, evidence inspector, bounded local preview, proposal print view, and pipeline foundation remain intact.
- **Verification:** Complete through local Playwright at 1440×900, 768×1024, and 390×844, plus the existing browser QA artifact. Native OS print dialog is not claimed.

### Phase 2 — Security and reliability

- **Implementation:** Complete. Public URL validation, private/reserved/mapped/mixed DNS rejection, validated redirects, pinned transport, DNS-inclusive deadlines, response limits, and bounded audit rate limits are preserved.
- **Verification:** Complete in the offline Node suite and Docker network-disabled suite. No live customer site was contacted.

### Phase 3 — Prospect and pipeline workflow

- **Implementation:** Complete. Selection persistence, latest audit context, provenance, valid next stages, stage controls, deduplication, PATCH validation, 404s, and latest-audit proposals are integrated with the authenticated workspace.
- **Verification:** Complete in backend tests and browser journeys, including refresh persistence and invalid transition rejection.

### Phase 4 — Analytics and proof library

- **Implementation:** Complete. Ordered SQLite migrations now persist audit-linked proof records, local re-check metadata, proposal revisions, and real/demo analytics. Demo-only records are excluded from real prospect, audit, proposal, and win-rate metrics. Proof search and provenance filtering are connected to the dashboard.
- **Verification:** Complete in backend persistence/API tests and browser proof-library smoke. Analytics range metadata is explicit and timestamps are stored in UTC.

### Phase 5 — Workspace and access protection

- **Implementation:** Complete for the local MVP. First-run owner bootstrap, salted scrypt passwords, opaque hashed session cookies, seven-day expiry, logout revocation, login rate limiting, same-origin mutation checks, workspace memberships, viewer write protection, and server-side ownership scoping are implemented. Legacy unowned data fails closed at bootstrap.
- **Verification:** Complete for anonymous denial, login/logout, session-backed access, cross-workspace isolation, CSRF/origin rejection, migration behavior, and Docker execution. Password reset, MFA, SSO, invitations, and public signup remain intentionally out of scope.

### Phase 6 — Proposal quality and complete product UX

- **Implementation:** Complete for the supported workflow. Proposals include finding, evidence source, bounded scope, next step, audit ID, revision, role/goal context, and provenance. GET proposal is side-effect-free; POST saves explicitly. Stale selection races are guarded, failed audits clear dependent state, controls are keyboard-labelled, modal/proposal focus behavior and Escape cleanup are implemented, and fabricated metrics/controls are removed or labelled unavailable.
- **Verification:** Complete through frontend syntax checks and Playwright journeys. The invalid live URL browser response is an intentional HTTP 400 negative case.

### Phase 7 — Docker, CI, reproducibility, and release preparation

- **Implementation:** Complete. Node.js 22.22.3 is aligned across `.nvmrc`, package engines, Docker, README, and CI. Docker creates `/app/data`, uses a volume, and has an exact runtime tag. `make test` includes frontend syntax. QA report, demo script, and submission draft are included.
- **Verification:** Complete locally: Docker Desktop Linux engine started successfully; image build passed; 21 tests passed with `--network none`; an isolated container health check returned `{"ok":true}`. No remote CI claim is made for this dirty working tree.

### Phase 8 — Consolidated integration and final QA

- **Implementation:** Complete for the authorized local scope. The issue ledger is represented by the fixed defects and documented limitations in `QA_REPORT.md`; no reset, push, deployment, or sibling-project edit occurred.
- **Verification:** Complete for the mandatory local gates and required browser viewport matrix. The built-in browser timed out on localhost, so supported local Playwright/Chrome was used instead. Native OS print output and external live-site smoke remain unclaimed.

## Final local gate

- `npm run typecheck` — passed.
- `npm test` — passed: 21 tests.
- `npm run build` — passed.
- `npm run test:frontend` / `node --check public/app.js` — passed.
- `git diff --check` — passed.
- `docker info` — passed after starting Docker Desktop.
- `docker build --tag proofpitch-ai:phase8 .` — passed.
- `docker run --rm --network none proofpitch-ai:phase8 npm test` — passed: 21 tests.
- Internal `docker exec` health check — passed: `{"ok":true}`.
- Playwright browser journeys — passed at 1440×900, 768×1024, and 390×844 with no horizontal overflow and no unexpected positive-flow console/request failures.

## Finalisation release review (2026-10-17)

- Candidate commit: `2ef87e6` (`feat: finalise evidence-backed proposal workflow`).
- Added operator-only production provisioning (`npm run provision:owner`), explicit production bootstrap rejection, bounded asynchronous login verification, resilient cookies, independent login throttles, JSON media-type checks, canonical-origin-aware mutation checks, private response `no-store`, generic unexpected-error handling, and graceful shutdown.
- Added additive migration 3 for immutable `proposal_revisions` and persisted `improvement_concepts`. Proposal GET and print remain side-effect-free; each explicit save creates a historical revision with audit, workspace, prospect and quotation context.
- Added the visible local improvement concept and an editable quotation workflow with ISO currency, 1–10 bounded line items, integer minor-unit totals, deliverables, exclusions, timeline and next step. Saved proposal print output uses the exact saved revision.
- Added SQLite online backup/restore tooling with integrity and foreign-key verification, a non-root Docker runtime, a container health check, `/app/data` volume support, `DEPLOYMENT.md`, and `COMMERCIAL_PLAN.md`.
- Final host suite: 34 tests passed; typecheck, build, frontend syntax and diff checks passed. Final local Playwright run passed bootstrap, demo audit, concept, quotation save, proposal print, refresh and responsive overflow checks at 1440×900, 768×1024 and 390×844.
- Backup and restore rehearsal passed against disposable files, preserving one owner, one prospect and one proposal revision. Final Docker image `proofpitch-ai:finalisation` passed the network-disabled 34-test suite and internal health as the non-root `node` user.
- No push, deployment, contest submission, customer contact or production data access occurred.

## Forwarded-origin follow-up (2026-10-18)

- Added a development-only GitHub Codespaces origin derivation from validated environment values; production and ordinary local development never derive this exception.
- Wired the same policy through bootstrap, login, logout, and authenticated write routes, with an application-level regression test that accepts the exact forwarded origin and rejects an attacker origin.
- Final host gate passed: `npm run typecheck`, `npm test` (39 tests), `npm run build`, `npm run test:frontend`, `node --check public/app.js`, and `git diff --check`.
- Final Docker verification passed: image build, `docker run --rm --network none ... npm test` (39 tests), and non-root internal `/health` returned `{"ok":true}`.
- Disposable API smoke passed against an isolated database: bootstrap/login, workspace identity marker, explicit demo audit, authenticated prospect creation, attacker-origin rejection (`403`), and logout. SQLite online backup and restore both passed integrity and foreign-key verification.
- The built-in browser required a sign-in handoff for localhost, so no new browser screenshot/viewport evidence is claimed for this follow-up. Existing Playwright/browser evidence remains historical and is documented above.


## Independent finalisation review (2026-10-17)

Reproduced seven regressions before repair: malformed-cookie failure, concurrent first-owner claims, login throttling bypass through varying accounts, proof detail disappearing outside the latest 200 records, preview rechecks crossing workspace/finding boundaries, stale proposal reads after a newer audit, and named demo data attaching to a real prospect. Repaired those paths and added bounded limiter capacity coverage.

Verified after the source repairs: typecheck, all 29 tests, production build, frontend syntax, and diff whitespace. Rebuilt proofpitch-ai:review; all 29 tests passed with --network none and internal health returned {"ok":true}. The isolated review container was removed. This is local Docker evidence, not remote CI. No new browser journey is claimed.

Corrected the README network-disabled/published-port example and clarified that .env is not automatically loaded. Existing pending work was preserved. No commit, push, public deployment, customer contact, or production database access occurred.

Open release requirements: operator-only production owner provisioning, trusted deployment origin/proxy policy, consistent backup/restore and volume-restart checks, a usable itemised quotation, bounded visual landing-page preview, immutable proposal history if revisions are advertised, and final browser/clean-clone CI evidence. Local MVP completion does not mean public release readiness.

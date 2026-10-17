# Phase 8 issue ledger

| Reproduction | Severity | Owner | Status |
| --- | --- | --- | --- |
| Start the app with a Docker `DATABASE_PATH` under a missing directory; the process previously failed before creating SQLite. | High | Release | Fixed: Docker now creates `/app/data` and sets the default path. Container health rechecked. |
| Open the app without a session and inspect the workspace API. | Critical | Backend | Fixed: workspace routes return 401; `/api/auth/me` returns an explicit unauthenticated state for the login gate. |
| Bootstrap through the browser and inspect the shell after the async request. | High | Frontend | Fixed: auth form handlers retain their form reference across awaits. Browser bootstrap journey passed. |
| Run a demo, refresh, and inspect selected context/evidence provenance. | Medium | Frontend | Fixed: provenance derives from the latest saved audit. Browser refresh journey passed. |
| Run a demo, then submit a rejected localhost URL. | Medium | Frontend | Fixed: audit-dependent state and local preview are cleared. The expected HTTP 400 remains visible. |
| Select prospects quickly while an audit request is pending. | Medium | Frontend | Fixed: selection tokens prevent stale responses from replacing newer context. Covered in implementation and current selection flow. |
| Use a legacy database with prospect rows but no ownership metadata. | Critical | Data/Auth | Fixed safely by failing closed at bootstrap and documenting explicit operator migration. |
| Run Docker health with `--network none`. | High | Release | Fixed: `/app/data` is created in the image; internal health returns `{"ok":true}`. |
| Ask for password recovery, MFA, SSO, invitations, or payment processing. | Medium | Product | Deferred intentionally; documented as MVP limitations. |
| Inspect the native OS print dialog or physical PDF output. | Low | QA | Not claimed; print-media CSS and in-page print view were verified. |

## Finalisation review additions

| Fresh production database could be claimed by first public visitor. | P0 | Backend/Release | Fixed: production rejects HTTP bootstrap; `npm run provision:owner` is the local operator path. Verified by production-mode route test. |
| Cookie mutation policy accepted missing Origin and had no canonical origin setting. | P0 | Backend/Release | Fixed: `APP_ORIGIN` is supported; production requires same-origin requests and secure cookies. Local missing-Origin behavior is explicitly limited to development without a configured origin. |
| JSON mutations accepted arbitrary media types and private responses lacked cache policy. | P0 | Backend | Fixed: JSON media type is required; JSON responses send `Cache-Control: no-store`. |
| Unexpected runtime/database failures were exposed as HTTP 400 messages. | P0 | Backend | Fixed: recognized validation errors retain stable responses; unexpected failures return generic HTTP 500. |
| Proposal save overwrote one row instead of preserving revisions. | P0 | Data | Fixed: migration 3 adds immutable `proposal_revisions`; revision allocation is transactional and older revision reads are scoped. Verified with two-snapshot regression. |
| Product lacked a visible improvement concept and priced quotation. | P1 | Product/Frontend | Fixed: dynamic safe concept panel and editable bounded minor-unit quotation are connected to explicit proposal save and print. Verified in Playwright. |
| Deployment had no consistent backup/restore or non-root/health configuration. | P1 | Release | Fixed: online SQLite backup/restore tool, integrity/foreign-key checks, Docker non-root user, volume, healthcheck, and `DEPLOYMENT.md`. Rehearsal passed on disposable files. |
| Commercial assumptions and pilot measurement were undocumented. | P1 | Product | Fixed: added `COMMERCIAL_PLAN.md` with editable assumptions, contribution model, measurement method and validation funnel. |


## Independent release review (2026-10-17)

| Reproduction | Status |
| --- | --- |
| Malformed unrelated cookie alongside a valid session. | Fixed: ignore malformed cookie without breaking authentication. |
| Two first-owner requests arrive before either body completes. | Fixed: atomic owner claim; one succeeds and the other conflicts. |
| Vary login account names to bypass per-source throttling. | Fixed: separate bounded IP/account limits and expired-capacity reclamation. |
| Read a proof outside the latest 200 records. | Fixed: direct workspace-scoped ID lookup. |
| Apply a meta recheck from another workspace or inspect unrelated findings. | Fixed: enforce workspace and audit/prospect ownership; update only missing-description finding. |
| Save a proposal, create a newer audit, then GET the proposal. | Fixed: fresh unsaved draft uses current audit; saved revision remains intact. |
| Attach named demo audit to a real website prospect. | Fixed: HTTP 409; fixture uses its own prospect. |
| Publish a container port while using --network none in README. | Fixed documentation: separate offline tests from loopback browser runtime. |
| Expose a fresh production database before owner provisioning. | OPEN blocker: HTTP bootstrap remains available to the first caller; add an operator-only production path. |
| Advertise immutable proposal revision history. | OPEN gap: current save overwrites one row and increments a counter. |

Host and offline Docker suites passed 29 tests. Typecheck, production build, frontend syntax, diff whitespace and internal container health passed. No remote CI or new browser journey is claimed for this dirty tree.

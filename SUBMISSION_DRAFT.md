# ProofPitch AI · submission draft

## Project description

ProofPitch AI is an offline-friendly, authenticated revenue workspace for small web agencies. It turns observable website HTML findings into an inspectable proof library, a bounded local preview, a deterministic proposal, and a server-enforced prospect pipeline.

## Problem

Small agencies often notice real website issues but lose the evidence and context between an initial audit, a sales conversation, and a proposal. Generic sales dashboards also blur demo data, guesses, and verified observations.

## Solution

ProofPitch AI stores immutable audit runs, explicit live/demo provenance, evidence-backed proof records, selected-prospect context, immutable proposal revisions, an editable local improvement concept and an operator-supplied quotation in SQLite. The core path is:

`explicit live/demo audit → evidence inspection → local concept → supported re-check → quotation → saved revision → printable view → pipeline stage`

## Architecture

- Node.js 22.22.3 and TypeScript HTTP server.
- SQLite with ordered additive migrations and foreign-key enforcement.
- Built-in Node `scrypt` password hashing and opaque hashed sessions.
- Workspace-scoped users, memberships, prospects, audits, proofs, proposals, and sessions.
- Static responsive HTML/CSS/JavaScript frontend with safe text-node rendering.
- Bounded SSRF-aware audit transport with validated DNS answers, redirects, timeouts, and response limits.
- Offline `node:test` suite and Docker/CI verification with network-disabled tests.

## Verified feature list

- Public URL validation and production pinned transport safeguards.
- Explicit named demo fixture with persisted provenance and no live fallback.
- Audit evidence inspector and bounded local meta-description re-check.
- Audit-linked proof library with search and live/demo filtering.
- Real-business analytics that exclude demo-only records.
- Authenticated local owner bootstrap, login, logout, session expiry, CSRF/origin checks, and workspace isolation.
- Deduplicated prospects, PATCH validation, server-enforced pipeline transitions, and selected-prospect persistence.
- Latest-audit proposal revisions with evidence sources, scope, next step, and provenance.
- Editable application-owned landing-page concept and bounded quotation with currency, minor-unit line items, deliverables, exclusions and timeline.
- Explicit proposal save with immutable historical revisions and older-revision retrieval.
- Operator-only production provisioning, online SQLite backup/restore verification, non-root Docker runtime and health check.
- Keyboard-friendly modal/proposal/mobile navigation behavior and responsive checks at three required viewports.
- Reproducible Node 22.22.3 Docker image, offline container suite, and internal health smoke.

## Honest limitations

This is a local MVP rather than a complete hosted SaaS identity platform. It does not include email verification, password recovery, MFA, SSO, invitations, payment processing, public hosting/TLS automation, customer messaging, contact scraping, or live website deployment. Browser evidence covers local Chrome and print-media emulation; it does not claim native OS print-dialog or physical-device verification. Legacy databases with unowned data fail closed until an operator performs an explicit migration.

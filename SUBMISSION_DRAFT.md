# ProofPitch AI · final submission draft

## Submission fields

- **Project title:** ProofPitch AI — Evidence to Proposal Workspace
- **One-line description:** Turn observable website findings into a provenance-aware, evidence-backed proposal without losing the audit context.
- **Target user:** Freelancers and small web agencies selling website improvement work.
- **Public repository:** https://github.com/Manthan29-hub/ProofPitch-AI
- **README/setup:** The repository README contains Node.js 22.22.3 setup, `npm ci`, `make test`, `make build`, Docker, authentication, backup/restore, and production limitations.
- **Demo video:** **Pending — no recording or shareable link exists yet.** Do not submit a placeholder URL.
- **Deployment:** **Not completed.** No public URL is claimed; the safe verified paths are local Docker and a temporary GitHub Codespace.
- **OmniRush Submission ID:** **Pending official listing review / not available.**

## Official listing snapshot

Checked on 2026-10-18 from the rendered Unstop listing: https://unstop.com/hackathons/omnirush-agentic-buildathon-2026-omnirush-1769914

- **Participation:** Individual participation is shown.
- **Visible timeline:** 14 Oct 2026, 11:00 PM IST → 21 Oct 2026, 12:00 AM IST.
- **Final submission:** The visible stage is **Final Submission**, marked live, with submission through the Unstop platform. The page does not show a separate registration-deadline field in the rendered content.
- **Visible account state:** The page shows a generic competition count of 2,452 registered and still shows a `Register` control. This does not establish the current user's registration state.
- **Participation flow:** The listing says to register on Unstop, install OmniRush, sign in with the registered email to activate tokens and the countdown, select a track, build, submit through the OmniRush dashboard to generate an `OFB-XXXXXX` Submission ID, and enter that ID in the Unstop submission.
- **Track visible on the page:** `Agents & Automation`.
- **Tooling visible on the page:** The listing advertises GPT-6 Astra tokens, access to GPT-6 models, and OmniRush sub-agents. The rendered listing did not display a separate exclusivity clause for other tools, so this draft does not make an unsupported exclusivity claim. The organizer permission supplied for this work allows OmniRush-native tools; retain that exact factual basis for any attestation.
- **Submission fields visible from the page:** An OmniRush Submission ID is explicitly required by the participation instructions. The rendered listing did not expose the complete final form, so video, repository, README, and live-deployment requirements remain unconfirmed rather than assumed.

## Short description

ProofPitch AI is an authenticated workspace for small web agencies. It turns explicit live or named-demo website audits into inspectable evidence, a bounded local improvement preview, an editable concept and quotation, and an immutable printable proposal revision.

## Full description

Small agencies often identify real website problems but lose the evidence and context between an audit, a sales conversation, and a proposal. ProofPitch AI keeps those steps connected without pretending that a demo result is a live result or that a quotation is measured business impact.

The working flow is:

`explicit live/demo audit → evidence inspector → local-only fix preview → improvement concept → editable quotation → saved proposal revision → print view → pipeline stage`

The named offline fixture makes the demo reproducible without contacting a customer website. A live URL remains a separate path with public-URL validation, bounded fetching, redirect checks, DNS safety checks, timeouts, response limits, and visible failure behavior. The server persists audit provenance, evidence-linked proofs, prospect context, proposal inputs, and immutable revisions in SQLite.

## What makes the workflow distinct

The product does not stop at a generic audit report. It preserves the chain from an observable finding to a bounded local preview, an application-owned improvement concept, operator-entered quotation data, and a revision that can be printed and reviewed later. Demo provenance is visible and excluded from real-business analytics. Opening a proposal is read-only; saving creates a historical revision.

## Technical architecture and reproducibility

- Node.js 22.22.3, TypeScript, and a small HTTP server.
- SQLite with ordered additive migrations, foreign-key enforcement, workspace-scoped records, and online backup/restore verification.
- Built-in Node `scrypt` password hashing and opaque hashed session cookies.
- Static responsive HTML/CSS/JavaScript frontend with safe text-node rendering.
- SSRF-aware audit transport with HTTP(S)-only validation, DNS/address checks, redirect validation, deadlines, and response-size/content-type limits.
- Reproducible Docker image running as non-root `node`, with `/app/data` volume support and `/health` check.
- Offline test suite and CI do not require live client sites or external AI services.

Exact local verification:

```bash
npm ci
make test
make build
docker build -t proofpitch-ai .
docker run --rm --network none -e NODE_ENV=development proofpitch-ai npm test
```

Latest verified state: 39 host tests passed, typecheck/build/frontend checks passed, 39 Docker network-disabled tests passed, non-root container health returned `{"ok":true}`, SQLite backup/restore passed integrity and foreign-key checks, and GitHub Actions passed at https://github.com/Manthan29-hub/ProofPitch-AI/actions/runs/39141932663.

## Honest limitations and non-claims

- This is a local MVP, not a complete hosted SaaS identity platform.
- No email verification, password reset, MFA, SSO, invitations, payments, messaging, contact scraping, or live website deployment is implemented.
- No business impact, revenue increase, customer, testimonial, or performance claim is made.
- No public deployment has been completed or tested.
- Browser evidence covers the documented Playwright/Chrome viewport checks and print-media emulation; native OS print dialogs and physical devices are not claimed.
- The current Codespaces-origin follow-up has API and CI coverage. No new browser screenshot or viewport evidence was recorded for that follow-up.
- Legacy databases with unowned records fail closed until an operator performs an explicit migration on a disposable copy.

## AI/tool-use compliance note

**Do not finalize this statement until the current official listing and any organizer permission are visibly checked.** The work in this OmniRush session used OmniRush-native file, terminal, browser, web-fetch, and documentation tools; no external AI/agent product was used. The exact contest attestation, if required, must be copied from the current official rules rather than inferred from this draft.

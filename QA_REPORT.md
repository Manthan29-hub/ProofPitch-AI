# ProofPitch AI final QA report

## Revision and environment

- Repository: `C:\Users\manth\OneDrive\Desktop\ProofPitch-AI`
- Source identity: finalisation candidate commit `2ef87e6` on `master`; branch remains six commits ahead of `origin/master`.
- Runtime: Node.js `v22.22.3` portable Windows runtime; Docker image runtime Node.js `v22.22.3`.
- Database: disposable QA database outside the repository at `C:\Users\manth\AppData\Local\Temp\omnirush\proofpitch-final-ui.sqlite`.
- Browser base URL: `http://127.0.0.1:4321/`.
- Browser runner: local Python Playwright 1.63.0 using the installed Chrome executable; the built-in browser timed out against localhost, so it was not used as evidence.

## Commands and results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | Passed, 34 tests |
| `npm run test:frontend` | Passed (`node --check public/app.js`) |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| `docker info` | Passed after starting the stopped Docker Desktop Linux engine |
| `docker build --tag proofpitch-ai:phase8 .` | Passed |
| `docker run --rm --network none -e NODE_ENV=development proofpitch-ai:finalisation npm test` | Passed, 34 tests |
| Internal container health: `docker exec proofpitch-phase8 node -e "fetch('http://127.0.0.1:3000/health')..."` | Passed: `{"ok":true}` |

The Windows shell did not provide `make`; the documented `make test` target was verified through its exact npm constituents (`npm run typecheck`, `npm test`, and `npm run test:frontend`). Ubuntu CI retains the `make` wrapper.

## Browser journeys

Playwright exercised the actual isolated server and database. The recorded artifacts are outside the repository under the OmniRush temporary directory:

- `proofpitch-final-ui2.json`
- `proofpitch-phase8-browser.json` and `proofpitch-phase8-browser-followup.json` are earlier checkpoints retained outside the repository.
- Screenshots for 1440×900, 768×1024, 390×844, and print media.

Passed journeys:

- First-run bootstrap and authenticated first load.
- Explicit named demo audit with an empty URL in the main form.
- Explicit named demo audit with an empty URL in the modal form.
- Demo provenance in selected prospect, evidence, and proposal views.
- Local meta-description preview and deterministic re-check.
- Proposal save, in-page print view, print-media emulation, and Escape cleanup.
- Refresh persistence of selected prospect and latest evidence.
- Mobile navigation `aria-expanded` and Escape behavior.
- Logout returns to the authentication gate.
- Rejected live localhost audit clears the preview/evidence state and does not add a prospect.
- No horizontal overflow at 1440×900, 768×1024, or 390×844.
- No unexpected console errors or failed requests in the positive browser run.
- Local improvement concept was visible and editable.
- Integer minor-unit quotation saved as an explicit proposal revision and rendered in print output.
- Backup/restore rehearsal preserved one owner, one prospect and one proposal revision.

The invalid localhost request intentionally produced HTTP 400 and a browser console resource message; it is classified as an expected negative-test response, not an application failure.

## Known limitations

- Native OS print dialog and physical PDF output were not inspected; only the in-page print view and print-media CSS were observed.
- The product intentionally has no password reset, email verification, MFA, SSO, public signup, invitations, payment provider, or multi-instance deployment.
- A legacy database containing prospects but no users fails closed at bootstrap. Ownership must be assigned by an operator on a disposable copy before reuse.
- Live customer websites were not contacted during this QA run; all product journeys used the named offline fixture and deterministic security mocks.

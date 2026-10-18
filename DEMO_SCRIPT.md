# ProofPitch AI · final 2–3 minute demo script

## Recording setup

- Use a disposable SQLite database outside the repository.
- Run the local app with Node.js 22.22.3 or the reproducible Docker image.
- Use only the named offline demo fixture. Do not enter or audit a real client URL.
- Keep the browser at a readable desktop size; the repository already documents responsive evidence at 1440×900, 768×1024, and 390×844.
- Keep the browser tab and terminal ready so the final shot can show the exact setup/test commands.

## Spoken script and actions

1. **Problem and trust (15 seconds).** Say: “Small agencies can find real website issues, but the evidence is often lost before a proposal is created. ProofPitch keeps the audit, proof, local improvement idea, quotation, and proposal revision connected.” Show the authenticated local workspace and explain that this demo uses no paid provider, API key, customer data, or live website.
2. **Run the named offline audit (20 seconds).** In **Run a prospect audit**, select **Use the named offline demo fixture** and submit with no URL. Point to the visible `DEMO` provenance and the fixed fixture URL `https://demo.proofpitch.local/`.
3. **Inspect evidence (20 seconds).** Open the evidence inspector. Show the title, missing meta description, H1, image/alt-text counts, links, audit ID, source, timestamp, and recommendations. Say: “These recommendations come from deterministic HTML observations; they are not invented business facts.”
4. **Show the local-only fix preview (20 seconds).** Enter a bounded meta description and select **Re-check preview**. Point to **Local preview only — no website changes made** and the local re-check marker. Say: “This is a preview against the stored finding. It does not deploy or modify the live website.”
5. **Connect the prospect and pipeline (15 seconds).** Select the demo prospect and move it from `Audited` to `Proposal ready`. Point out that the transition is server-enforced and demo records are excluded from real-business analytics.
6. **Create the improvement concept and quotation (25 seconds).** Show the editable application-owned improvement concept. Add a currency, one or two minor-unit line items, deliverables, exclusions, timeline, and next step. Point out the computed total and say: “The amount is operator-supplied quotation data, not measured revenue or a prediction.”
7. **Save an evidence-backed proposal revision (20 seconds).** Choose **Review and save proposal**. Show the selected prospect, audit ID, revision, provenance, evidence sources, bounded scope, quotation, and next step. Explain that each explicit save creates an immutable historical revision and that opening a proposal is read-only.
8. **Print and persist (15 seconds).** Open the in-page print view, show the concept and quotation, press Escape, and refresh. Point out that the selected prospect and latest evidence remain associated.
9. **Honest failure case (15 seconds).** Submit an invalid live URL such as `http://localhost:3000` with demo mode disabled. Show the validation/error response and explain: “Live failures remain errors. They do not silently become demo results and do not create a partial live prospect.”
10. **Close with reproducibility (15 seconds).** Show the repository URL and terminal commands:

   ```text
   npm ci
   make test
   make build
   docker build -t proofpitch-ai .
   docker run --rm --network none -e NODE_ENV=development proofpitch-ai npm test
   ```

   Say: “The current repository has 39 passing offline tests, a passing Docker health check, and passing GitHub Actions CI. No public deployment is claimed; the safe demo path is local Docker or a temporary Codespace.”

## Concise on-screen shot list

| Shot | Approx. time | Screen content | Judge takeaway |
| --- | ---: | --- | --- |
| 1 | 0:00–0:15 | Authenticated dashboard + title | Problem, target user, trustworthy local scope |
| 2 | 0:15–0:35 | Demo audit form and result | Explicit demo mode and provenance |
| 3 | 0:35–0:55 | Evidence inspector | Concrete observable findings and audit ID |
| 4 | 0:55–1:15 | Local preview/re-check | Improvement is bounded and non-deploying |
| 5 | 1:15–1:30 | Prospect pipeline | Evidence remains connected to workflow state |
| 6 | 1:30–1:55 | Concept and quotation | Operator-owned proposal inputs, no fabricated metrics |
| 7 | 1:55–2:15 | Saved revision + print view | Immutable, printable evidence-backed proposal |
| 8 | 2:15–2:30 | Invalid live URL + terminal/repository | Honest failure behavior and reproducibility |

## Video status

**Pending.** No recording or shareable video link has been created or checked in the available environment. This script and shot list are ready for recording; do not enter a video URL in the submission until a recording has been made and reviewed.

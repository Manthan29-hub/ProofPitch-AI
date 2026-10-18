# ProofPitch AI deployment feasibility review

Reviewed 2026-10-18 using official vendor documentation and pricing pages only. No account was created, no payment method was entered, and no deployment was attempted.

## Decision

**Do not force a public 24/7 deployment for this submission.** No researched option met all of the requirements simultaneously at a genuinely $0 cost while preserving the current single-instance SQLite design, persistent storage, HTTPS, secret configuration, Docker/health-check operation, and practical backup/restore.

The safe submission status is **deployment not completed**. Use the verified local Docker path for recording, or use a temporary GitHub Codespace if the account has unused included quota. A Codespace is a temporary demo environment, not a production hosting claim.

## Option review

### GitHub Codespaces — suitable for a temporary demo only

Official GitHub documentation says personal GitHub Free accounts include 120 compute hours and 15 GB-month storage per month. Codespaces storage includes repository files and data loaded into the codespace, so SQLite can remain on the codespace filesystem while that codespace exists. GitHub port forwarding supports HTTPS and public visibility, but a forwarded URL exists only while the codespace and process are running.

This is suitable for a judge walkthrough if the account has quota remaining and the port is intentionally made public. It is not 24/7 hosting, does not provide a stable deployment URL, and should not be described as production deployment. Keep the database disposable and run the existing backup command before stopping the environment.

Sources:

- https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-codespaces/about-billing-for-github-codespaces
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace

### Render Free — rejected for the current SQLite release

Render’s official free-service documentation confirms free Node/Docker web services, managed TLS, environment configuration, health checks, and 750 free instance hours per workspace per month. It also explicitly says free web services have ephemeral filesystems, lose local SQLite databases on restart/redeploy/spin-down, and cannot attach persistent disks. Free Render Postgres expires after 30 days and has no backups.

Therefore Render Free is not safe for this application’s SQLite persistence and backup requirements. It could only be considered after a deliberate database migration and a separate persistence/recovery design, which is outside this finish pass.

Sources:

- https://render.com/docs/free
- https://render.com/pricing

### Fly.io — rejected because it is not genuinely free

Fly.io’s official pricing states that new organizations have no free tier or monthly free usage allowance, the smallest always-on Machine costs $2.19 per 30 days, volumes cost $0.15/GB-month, and organizations require a credit card on file. Fly Volumes would be technically appropriate for SQLite, but this violates the no-spend/no-payment boundary.

Source:

- https://fly.io/docs/about/pricing/

### Cloudflare Workers/D1 — rejected for this unchanged application

Cloudflare’s official pricing documents a Workers Free plan and free D1/SQLite-backed Durable Object quotas, but this is a different serverless runtime and storage model. The current application is a Node.js Docker/SQLite server using `better-sqlite3`, a writable filesystem, process environment configuration, and an HTTP health check. A Cloudflare port would require a deliberate application/storage rewrite, not a safe deployment of the current image. Cloudflare Containers are not included on the Workers Free plan.

Source:

- https://developers.cloudflare.com/workers/platform/pricing/

## Safe demo run path

### Local Docker

```bash
npm ci
docker build -t proofpitch-ai .
docker run --rm -p 127.0.0.1:3000:3000 \
  -e NODE_ENV=development \
  -e DATABASE_PATH=/app/data/proofpitch.sqlite \
  -v proofpitch-demo-data:/app/data \
  proofpitch-ai
```

Use the named offline fixture only. For a clean recording, use a new disposable volume or a database path outside the repository. Do not expose the owner bootstrap publicly.

### Temporary Codespace

1. Open the public repository in GitHub Codespaces.
2. Run the project with Node.js 22.22.3 and the documented `npm ci` / `npm run dev` commands, or run the Docker image if Docker is available in the codespace.
3. Forward port 3000 over HTTPS.
4. If a judge must access it without GitHub authentication, intentionally set the forwarded port visibility to public and treat the URL as temporary.
5. Use only disposable demo data, save a backup before stopping, and do not call the URL a production deployment.

## Configuration and recovery requirements for any future production host

The host must provide all of the following before deployment is called safe:

- Persistent writable storage mounted at `/app/data` for SQLite.
- HTTPS with a fixed `APP_ORIGIN` and `COOKIE_SECURE=true`.
- Environment-variable/secret configuration without committing credentials.
- Docker/Node.js 22.22.3 compatibility and the existing `/health` check.
- A private operator path for `npm run provision:owner`; no public owner bootstrap.
- A scheduled or operator-controlled online SQLite backup and disposable restore rehearsal.
- A single application instance unless the storage and locking design is deliberately migrated.

No public URL or deployment link should be placed in the contest submission unless all of these checks pass against the actual host.

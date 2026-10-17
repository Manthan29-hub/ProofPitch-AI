# ProofPitch AI deployment and recovery runbook

## Supported architecture

Use one Docker instance with a persistent writable volume mounted at `/app/data`, SQLite, and an HTTPS reverse proxy that forwards only to the configured `APP_ORIGIN`. This release is intentionally single-instance; it does not claim horizontal scaling or high availability.

Required production settings:

```text
NODE_ENV=production
APP_ORIGIN=https://app.example.test
COOKIE_SECURE=true
DATABASE_PATH=/app/data/proofpitch.sqlite
```

The application does not load `.env` automatically. Inject these values through the process manager, container environment, or hosting provider configuration. Do not trust arbitrary forwarded headers; configure the ingress to provide the canonical public origin and keep the application origin fixed.

## Provision and start

1. Create or attach a persistent volume for `/app/data`.
2. Build the exact locked image with `docker build -t proofpitch-ai .`.
3. Provision the first owner from a private operator shell:

   ```bash
   docker run --rm -it -v proofpitch-data:/app/data \
     -e NODE_ENV=production -e DATABASE_PATH=/app/data/proofpitch.sqlite \
     proofpitch-ai npm run provision:owner
   ```

4. Start exactly one instance and expose it only behind HTTPS:

   ```bash
   docker run -d --name proofpitch \
     -p 127.0.0.1:3000:3000 -v proofpitch-data:/app/data \
     -e NODE_ENV=production -e APP_ORIGIN=https://app.example.test \
     -e COOKIE_SECURE=true -e DATABASE_PATH=/app/data/proofpitch.sqlite \
     proofpitch-ai
   ```

5. Check `/health` through the private loopback binding and check the container health status. Do not expose port 3000 directly to the public internet.

## Backup

Run the online backup tool while the application is live:

```bash
npm run db:backup -- --source ./data/proofpitch.sqlite --destination ./backups/proofpitch-YYYYMMDD-HHMMSS.sqlite
```

For a container, run the command from a temporary utility container with the same volume mounted, or copy the built `db-tool` command into the operator environment. The tool uses SQLite's backup API and verifies `integrity_check` plus `foreign_key_check`. Do not copy only the main database file while WAL writes are active.

## Restore and rollback

1. Stop the application or route traffic away from it.
2. Restore into a new disposable volume/path:

   ```bash
   npm run db:restore -- --source ./backups/proofpitch-YYYYMMDD-HHMMSS.sqlite --destination ./restore/proofpitch.sqlite
   ```

3. Check that the restored database reports clean integrity/foreign-key checks and contains representative users, prospects, audits, proofs, concepts and proposal revisions.
4. Start a temporary isolated instance against the restored path and verify owner login, selected prospect evidence, proof detail and older proposal revision access.
5. Replace the application volume only after those checks pass. Preserve the original volume until the replacement has completed its health and login checks.

Rollback is the same process using the last verified backup. Never test restoration against the user's original development database or a production volume in place.

## Recovery limitations

- One instance only; no automatic failover.
- Persistent storage is not a backup.
- Password recovery, MFA, SSO and email delivery are not included.
- Legacy databases with unowned records require an explicit operator migration on a disposable copy and remain closed to HTTP owner bootstrap.

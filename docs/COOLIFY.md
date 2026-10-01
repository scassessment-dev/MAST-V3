# MAST V3 production deployment

Database decision: **EXTEND-DB01**. The supplied SMVS baseline has PostgreSQL
16/18, but MariaDB is pending. The selected engine is **MariaDB 11.8.9**.
Deploy the apps only after the server administrator verifies that version on
DB01. PostgreSQL and the archived Prisma schema are not used.

## Layout and storage

- PROD-1: one Coolify project with two app resources; DB01: one shared dedicated DB.
- Do not deploy a relational DB resource or DB volume in production Coolify.
- No persistent user-upload/media path exists in this app. Images, fonts and guide
  content are bundled assets; PDFs and CSVs are generated on demand. No /srv/media
  bind is required now. Re-review this if uploads are added.
- Docker engine storage and the QNAP mount are server prerequisites managed by the
  administrator, not directories this repository should create.

## Server administrator tasks

1. Audit DB01 services, versions, free space, ports and network rules. Verify
   official runtime/package support for MariaDB 11.8.9. Preserve PostgreSQL.
   Review any difference from the supplied baseline before changing it.
2. Provision MariaDB 11.8.9 with live files under /srv/dbdata/mariadb/11.8.9/...,
   an audited unique port (3306 if free), internal binding and automatic startup.
3. Allow only the approved app source, normally PROD-1 192.168.20.10, to reach
   DB01 192.168.40.10 on that port. Never allow WAN database access. Verify an
   authenticated connection from the actual app host/container network.
4. Create empty mast_v3_prod with utf8mb4 and a dedicated source-restricted user.
   Runtime needs SELECT, INSERT, UPDATE and DELETE on this DB only. Use a separate
   temporary project-scoped migration credential for CREATE/ALTER and the import;
   remove/revoke its DDL privileges afterward. Never use a DB superuser in the apps.
5. Configure backups to a dedicated backup target and test restoring a copy.
   Live DB files do not belong under /srv/media, in Git or in the app image.
6. Generate production passwords locally. Rotate any credentials/private keys
   previously tracked in repository history: excluding the next commit does not
   remove older copies. Do not paste real passwords into chat or documentation.

## Coolify resources

Use the root Dockerfile, context / and target **runtime** (or no target, since
runtime is the last stage). Do not choose docker-compose.local.yml.
Use an approved production Git revision only after user approval to push.

| Resource | Build argument | Internal port | Health path |
| --- | --- | --- | --- |
| Participant | APP_NAME=participant | 3000 | /api/health |
| Admin | APP_NAME=admin | 3001 | /api/health |

Give each resource its final HTTPS hostname. Point DNS to the Coolify proxy using
the existing SMVS domain/network arrangement and enable HTTPS. Do not expose
3000/3001 directly to WAN.

Set these as protected **runtime** variables, not build secrets:

| Variable | Participant | Admin |
| --- | --- | --- |
| DATABASE_URL | Required | Required, same DB |
| DATABASE_CONNECTION_LIMIT | 10 initially | 10 initially |
| AUTH_SECRET | Optional, same environment secret if set | Required, new long random value |
| PARTICIPANT_URL | Not needed | Required, participant HTTPS URL |
| PORT | 3000 | 3001 |
| TZ | Asia/Kolkata | Asia/Kolkata |

Connection template (use the port confirmed by the DB01 audit):

```text
mysql://mast_v3_prod_app:<url-encoded-password>@192.168.40.10:3306/mast_v3_prod
```

.env.production.example contains placeholders only. Never upload local .env
files. If DB01 requires TLS, set DATABASE_SSL=true and supply the trusted CA via
DATABASE_SSL_CA_PATH. Certificate verification remains enabled.

## Controlled one-time data import

Startup/redeploy never creates tables or seeds data. For old data use migration,
not db:init first: migration requires an empty target. db:init is for a fresh
installation without importing old data.

1. Pause old-site submissions and take a final consistent SQLite snapshot. Keep
   the original app revision/settings and snapshot as the rollback point.
2. Build tooling from the approved revision:

   ```sh
   docker build --target migration -t mast-v3-migration .
   ```

3. On an authorized machine that reaches DB01, mount the SQLite snapshot read-only
   at /source/mast.sqlite. Supply a protected temporary environment file outside
   Git with the dedicated migration DATABASE_URL, CONFIRM_SQLITE_MIGRATION=true,
   and SQLITE_SOURCE_PATH=/source/mast.sqlite.

   ```sh
   docker run --rm --env-file /secure/path/mast-migration.env \
     --mount type=bind,src=/approved/path/mast.sqlite,dst=/source/mast.sqlite,readonly \
     mast-v3-migration
   ```

   These host paths are placeholders to replace. Migration stops on a non-empty
   target or a server other than MariaDB 11.8.9. Every inserted value (including
   password hashes and Gujarati text) is fingerprinted before commit. A mismatch
   rolls back imported rows. Schema DDL is separate and may leave empty tables
   after a failed first attempt.
4. Record all printed counts and verify a sample account/result. Revoke the
   temporary migration credential and remove its temporary secret file.
5. Set runtime-only app credentials in both Coolify resources, then deploy.
   Keep the SQLite snapshot outside the app image.

## Acceptance and rollback

- Both /api/health endpoints must return 200, checking DB connectivity and response
  and account tables. A login page alone is not a readiness check.
- Test login and allocated data visibility, participant submission, second test,
  result, Gujarati PDF, filters, CSV and deletion of a disposable new test response.
  Confirm Take Test points to the final participant domain.
- Verify actual DB01 version/port/data path and absence of any accidental local
  relational DB container or live DB files in the Coolify apps.
- The runtime app image uses node UID/GID 1000/1000. It needs no privileged mode,
  host networking, Docker socket, device mount or persistent media bind.
- Redeploy one app and verify DB01 data survives; monitor both health checks.
- Before accepting new live submissions, roll back a failed cutover by stopping
  only these two resources and restoring old app/settings and SQLite snapshot.
  After new MariaDB submissions exist, pause writes and reconcile them before
  reverting. Do not discard new submissions by blindly switching to old SQLite.
- Stop if the selected database is unavailable, import/network verification fails,
  required secrets/domains are absent, live DB data is misplaced, or there is no
  backup/rollback plan.

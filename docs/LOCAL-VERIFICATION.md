# Local deployment verification — 2026-10-01

## Status and boundaries

The two production Docker app builds have been verified locally against
MariaDB **11.8.9**. This is local verification, not a production deployment.
No Git commit/push, DB01 provisioning or Coolify production change was made
during this implementation.

- Participant preview: http://localhost:3000
- Admin preview: http://localhost:3001
- Local database is exposed only on 127.0.0.1:3307.
- Original SQLite data is unchanged; its SHA-256 matches the pre-import snapshot.
- Existing accounts retain their original password hashes.

## Data conversion

The importer checked every source and destination value using per-table
fingerprints before committing. Imported record counts:

| Table | Records |
| --- | ---: |
| Zones | 16 |
| Centers | 60 |
| Admin accounts | 137 |
| Test responses | 109 |
| First-test answers | 1,090 |
| Second-test answers | 850 |
| Statements | 40 |
| Metadata | 1 |

Disposable verification records were removed, and original table counts were
checked afterward. The importer also correctly refused a second import into
the populated database.

## Verified locally

- Both production images build successfully; both running apps report healthy.
- Runtime images run as non-root UID 1000; inspected app images contain no
  `.env` files, SQLite databases or ZIP backups.
- Script type checks and 15 automated unit tests pass.
- Integration checks pass for database readiness, incorrect/correct login,
  anonymous-access rejection and allocated-center data visibility.
- The admin test link reads the participant URL at runtime.
- A participant submission preserves its Gujarati Global ID and first-test answers.
- A failed second-test write rolls back; concurrent retries do not duplicate answers.
- Filtered response lookup, CSV export, Gujarati PDF generation and deletion pass.
- Local secrets and database backups are ignored by Git.

## Remaining production work — server administrator

Follow [COOLIFY.md](COOLIFY.md), using the final approved Git revision only after
the user authorizes uploading it. The administrator must provision/audit DB01,
configure restricted database users and networking, backups and restore testing,
set the two Coolify resources' protected runtime variables, configure domains
and HTTPS, perform the controlled final data import, and run production
acceptance checks. Local data conversion does not transfer data to DB01.

Rotate credentials/private keys previously present in repository history before
production use. Removing those files from future tracking does not erase history.

User functional acceptance is still pending; the user requested to test after
the deployment corrections were completed.

# MAST Gujarati Test Web App

Two-app Next.js monorepo for the Gujarati MAST work-style test.

## Apps

- `apps/participant`: public test and personal result PDF.
- `apps/admin`: protected role-scoped dashboard and exports.

## Local MariaDB test setup

The application now uses MariaDB. Test locally before connecting anything to DB01 or Coolify.

1. Install and start Docker Desktop.
2. Create the local MariaDB settings file:

```powershell
Copy-Item .env.mariadb.local.example .env.mariadb.local
```

3. Set local-only passwords in `.env.mariadb.local`, then create/update `.env.local` with the matching connection string:

```text
DATABASE_URL="mysql://mast_v3_test_app:<url-encoded-local-password>@127.0.0.1:3307/mast_v3_test"
AUTH_SECRET="a-new-long-local-test-secret"
```

4. Start local MariaDB 11.8.9:

```powershell
docker compose -f docker-compose.local.yml up -d
```

5. Import the existing SQLite data once into the empty local test database. Do not run `db:init` before importing. The command stops if the target already contains MAST data and verifies every imported value and table count. It loads `.env.local` automatically:

```powershell
$env:CONFIRM_SQLITE_MIGRATION="true"
pnpm db:migrate:sqlite
```

6. Start both applications:

```powershell
pnpm dev
```

Participant runs on port `3000`; admin runs on port `3001`. Both health endpoints are available at `/api/health`.

Do not use a DB01 or production connection string during this local testing phase.

## Production deployment

See [the Coolify and DB01 checklist](docs/COOLIFY.md).
Use Node.js 22.13+ and the pinned pnpm 11.10.0.
The Dockerfile creates separate non-root application images with `APP_NAME=admin`
or `APP_NAME=participant`. Its `migration` target contains the one-time import tools.
Local Compose is for local MariaDB testing only.

Runtime variables are listed in `.env.production.example` (placeholders only).
Set the admin resource's `PARTICIPANT_URL` to the final participant HTTPS address.
App timestamps are stored in UTC and displayed in Asia/Kolkata.
`prisma/schema.prisma` and SQLite maintenance scripts are archived tools,
not the current production database definition.

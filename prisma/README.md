# Archived schema

`schema.prisma` belongs to the original PostgreSQL design and is not used by either application.
Do not run Prisma migration commands for MAST V3.
The current database is MariaDB 11.8.9; its schema is defined in
`packages/database/src/mariadb.ts` and initialized by `pnpm db:init`.
Existing SQLite data is imported with `pnpm db:migrate:sqlite` instead.

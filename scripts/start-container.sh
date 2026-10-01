#!/bin/sh
set -eu

case "${APP_NAME:-}" in
  admin) PORT="${PORT:-3001}" ;;
  participant) PORT="${PORT:-3000}" ;;
  *) echo "APP_NAME must be admin or participant." >&2; exit 1 ;;
esac
export PORT

node --input-type=module -e '
const url = new URL(process.env.DATABASE_URL || "invalid:");
if (!["mysql:", "mariadb:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
  throw new Error("Configure DATABASE_URL with the dedicated MariaDB application account.");
}
if (process.env.APP_NAME === "admin") {
  if ((process.env.AUTH_SECRET || "").length < 16) throw new Error("Configure AUTH_SECRET (at least 16 characters).");
  const participant = new URL(process.env.PARTICIPANT_URL || "invalid:");
  if (!["http:", "https:"].includes(participant.protocol)) throw new Error("Configure PARTICIPANT_URL.");
}
'

exec node "/app/apps/${APP_NAME}/server.js"

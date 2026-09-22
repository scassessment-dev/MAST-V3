import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { CENTER_SEEDS, SECOND_TEST_STATEMENTS, type MastType } from "@mast/core";

const databasePath = resolve(process.env.DATABASE_PATH ?? "data/mast.sqlite");
if (!existsSync(dirname(databasePath))) mkdirSync(dirname(databasePath), { recursive: true });
const client = createClient({ url: `file:${databasePath}` });

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function ensureColumn(name: string, definition: string) {
  const result = await client.execute("PRAGMA table_info(test_responses)");
  const columns = new Set((result.rows as Array<{ name: string }>).map((row) => row.name));
  if (!columns.has(name)) await client.execute(`ALTER TABLE test_responses ADD COLUMN ${definition}`);
}

async function main() {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS zones (id TEXT PRIMARY KEY, name TEXT NOT NULL, display_order INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS centers (id TEXT PRIMARY KEY, no INTEGER NOT NULL, name TEXT NOT NULL, zone_id TEXT NOT NULL, FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE RESTRICT)`,
    `CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('MASTER_ADMIN','ZONE_ADMIN','CENTER_ADMIN')), gender_scope TEXT NOT NULL DEFAULT 'All' CHECK (gender_scope IN ('Male','Female','All')), zone_id TEXT, center_id TEXT, is_active INTEGER NOT NULL CHECK (is_active IN (0,1)), last_login_at TEXT, created_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS test_responses (id TEXT PRIMARY KEY, participant_name TEXT NOT NULL, age INTEGER NOT NULL, gender TEXT NOT NULL CHECK (gender IN ('Male','Female')), zone_id TEXT NOT NULL, center_id TEXT NOT NULL, score_m INTEGER NOT NULL, score_a INTEGER NOT NULL, score_s INTEGER NOT NULL, score_t INTEGER NOT NULL, primary_type TEXT NOT NULL CHECK (primary_type IN ('M','A','S','T')), secondary_type TEXT NOT NULL CHECK (secondary_type IN ('M','A','S','T')), sequence TEXT NOT NULL, submitted_at TEXT NOT NULL, valid TEXT, second_test_yes_count INTEGER, second_test_primary_type TEXT, second_test_is_valid INTEGER CHECK (second_test_is_valid IN (0,1)), service_priority_1 TEXT, service_priority_2 TEXT, service_priority_3 TEXT)`,
    `CREATE TABLE IF NOT EXISTS test_response_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, test_response_id TEXT NOT NULL, block_number INTEGER NOT NULL CHECK (block_number BETWEEN 1 AND 10), most TEXT NOT NULL CHECK (most IN ('A','B','C','D')), least TEXT NOT NULL CHECK (least IN ('A','B','C','D')), FOREIGN KEY (test_response_id) REFERENCES test_responses(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS test_response_second_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, test_response_id TEXT NOT NULL, question_index INTEGER NOT NULL CHECK (question_index BETWEEN 0 AND 9), answer_value INTEGER NOT NULL CHECK (answer_value IN (0,1)), FOREIGN KEY (test_response_id) REFERENCES test_responses(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS second_test_statements (id INTEGER PRIMARY KEY AUTOINCREMENT, mast_type TEXT NOT NULL CHECK (mast_type IN ('M','A','S','T')), question_index INTEGER NOT NULL CHECK (question_index BETWEEN 0 AND 9), statement_text TEXT NOT NULL, UNIQUE (mast_type, question_index))`,
    `CREATE INDEX IF NOT EXISTS idx_test_responses_submitted ON test_responses(submitted_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_test_responses_zone ON test_responses(zone_id)`,
    `CREATE INDEX IF NOT EXISTS idx_test_responses_center ON test_responses(center_id)`
  ], "write");

  await ensureColumn("service_priority_1", "service_priority_1 TEXT");
  await ensureColumn("service_priority_2", "service_priority_2 TEXT");
  await ensureColumn("service_priority_3", "service_priority_3 TEXT");
  await ensureColumn("second_test_primary_type", "second_test_primary_type TEXT");

  const zones = new Map<string, string>();
  CENTER_SEEDS.forEach((seed) => zones.set(`zone-${slug(seed.zone)}`, seed.zone));
  await client.batch([
    ...Array.from(zones.entries()).map(([id, name], displayOrder) => ({
      sql: "INSERT OR IGNORE INTO zones (id, name, display_order) VALUES (?, ?, ?)", args: [id, name, displayOrder]
    })),
    ...CENTER_SEEDS.map((seed) => ({
      sql: "INSERT OR IGNORE INTO centers (id, no, name, zone_id) VALUES (?, ?, ?, ?)",
      args: [`center-${seed.no}`, seed.no, seed.center, `zone-${slug(seed.zone)}`]
    })),
    ...(["M", "A", "S", "T"] as MastType[]).flatMap((type) => SECOND_TEST_STATEMENTS[type].map((statement, index) => ({
      sql: "INSERT OR IGNORE INTO second_test_statements (mast_type, question_index, statement_text) VALUES (?, ?, ?)",
      args: [type, index, statement]
    })))
  ], "write");

  console.log(`SQLite initialized/migrated: ${databasePath}`);
  console.log(`Centers ensured: ${CENTER_SEEDS.length}. No admin credentials were created.`);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

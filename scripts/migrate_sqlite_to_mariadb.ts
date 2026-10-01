import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";
import { createHash } from "node:crypto";
import { getMariaDbPool, initializeMariaDb, mariaDbTableCounts } from "@mast/database";

const sourcePath = resolve(process.env.SQLITE_SOURCE_PATH ?? "data/mast.sqlite");
const sourceTables = [
  { name: "zones", columns: ["id", "name", "display_order"] },
  { name: "centers", columns: ["id", "no", "name", "zone_id"] },
  { name: "admin_users", columns: ["id", "name", "email", "password_hash", "role", "gender_scope", "zone_id", "center_id", "is_active", "last_login_at", "created_at"] },
  { name: "test_responses", columns: ["id", "participant_name", "age", "gender", "zone_id", "center_id", "score_m", "score_a", "score_s", "score_t", "primary_type", "secondary_type", "sequence", "submitted_at", "valid", "second_test_yes_count", "second_test_primary_type", "second_test_is_valid", "service_priority_1", "service_priority_2", "service_priority_3", "global_id"] },
  { name: "test_response_answers", columns: ["id", "test_response_id", "block_number", "most", "least"] },
  { name: "test_response_second_answers", columns: ["id", "test_response_id", "question_index", "answer_value"] },
  { name: "second_test_statements", columns: ["id", "mast_type", "question_index", "statement_text"] },
  { name: "metadata", columns: ["exported_at", "total_zones", "total_centers", "total_admin_users", "total_test_responses", "total_answers", "total_second_answers"] }
] as const;

function fingerprint(rows: Array<Record<string, unknown>>, columns: readonly string[]): string {
  const normalized = rows.map((row) => JSON.stringify(columns.map((column) => {
    const value = row[column];
    if (value === null || value === undefined) return null;
    if (value instanceof ArrayBuffer) return Buffer.from(value).toString("hex");
    if (Buffer.isBuffer(value)) return value.toString("hex");
    return String(value);
  }))).sort();
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

async function main() {
  if (process.env.CONFIRM_SQLITE_MIGRATION !== "true") {
    throw new Error("Set CONFIRM_SQLITE_MIGRATION=true before importing data into MariaDB.");
  }
  if (!existsSync(sourcePath)) throw new Error(`SQLite source was not found: ${sourcePath}`);

  const source = createClient({ url: `file:${sourcePath}`, intMode: "number" });
  const destination = getMariaDbPool();
  const tableNames = sourceTables.map((table) => table.name);

  try {
    const [versionRows] = await destination.query("SELECT VERSION() AS version");
    const version = (versionRows as Array<{ version: string }>)[0]?.version ?? "";
    if (!version.startsWith("11.8.9") || !version.includes("MariaDB")) {
      throw new Error("Migration requires the selected MariaDB 11.8.9 server. Check the destination configuration.");
    }
    // Read all source tables before making any schema or data changes.
    const snapshots = new Map<string, Array<Record<string, unknown>>>();
    for (const table of sourceTables) {
      const result = await source.execute(`SELECT ${table.columns.map((column) => `\`${column}\``).join(", ")} FROM \`${table.name}\``);
      snapshots.set(table.name, result.rows as unknown as Array<Record<string, unknown>>);
    }
    await initializeMariaDb({ seed: false });
    const destinationCounts = await mariaDbTableCounts([...tableNames]);
    const existingRows = (Object.entries(destinationCounts) as Array<[string, number]>).filter(([, total]) => total > 0);
    if (existingRows.length > 0) {
      throw new Error(`MariaDB target must be empty before migration. Existing rows: ${existingRows.map(([table, total]) => `${table}=${total}`).join(", ")}`);
    }

    const connection = await destination.getConnection();
    try {
      await connection.beginTransaction();
      for (const table of sourceTables) {
        const rows = snapshots.get(table.name)!;
        if (rows.length === 0) continue;

        const insert = `INSERT INTO \`${table.name}\` (${table.columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${table.columns.map(() => "?").join(", ")})`;
        for (const row of rows) {
          const values = table.columns.map((column) => {
            const value = row[column];
            return value instanceof ArrayBuffer ? Buffer.from(value) : value ?? null;
          });
          await connection.execute(insert, values as unknown as any[]);
        }
      }
      // Verify every value, including password hashes and Gujarati text, before committing.
      for (const table of sourceTables) {
        const [rows] = await connection.query(`SELECT ${table.columns.map((column) => `\`${column}\``).join(", ")} FROM \`${table.name}\``);
        if (fingerprint(snapshots.get(table.name)!, table.columns) !== fingerprint(rows as Array<Record<string, unknown>>, table.columns)) {
          throw new Error(`Migration data mismatch in ${table.name}; imported rows will be rolled back.`);
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const sourceCounts = Object.fromEntries(tableNames.map((table) => [table, snapshots.get(table)!.length]));
    const finalCounts = await mariaDbTableCounts([...tableNames]);
    const mismatches = tableNames.filter((table) => sourceCounts[table] !== finalCounts[table]);
    if (mismatches.length > 0) {
      throw new Error(`Migration count mismatch: ${mismatches.map((table) => `${table}: SQLite=${sourceCounts[table]}, MariaDB=${finalCounts[table]}`).join("; ")}`);
    }

    console.log("SQLite to MariaDB migration completed successfully.");
    for (const table of tableNames) console.log(`${table}: ${finalCounts[table]}`);
  } finally {
    source.close();
    await destination.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

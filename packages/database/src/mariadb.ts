import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import { readFileSync } from "node:fs";
import { CENTER_SEEDS, SECOND_TEST_STATEMENTS, type MastType } from "@mast/core";

let pool: Pool | null = null;

function requiredDatabaseUrl(): URL {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL must be set to a MariaDB connection URL.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid MariaDB connection URL.");
  }

  if (url.protocol !== "mysql:" && url.protocol !== "mariadb:") {
    throw new Error("DATABASE_URL must use the mysql:// or mariadb:// protocol.");
  }
  if (!url.hostname || !url.pathname || url.pathname === "/") {
    throw new Error("DATABASE_URL must include a host and database name.");
  }
  return url;
}

export function getMariaDbPool(): Pool {
  if (pool) return pool;

  const url = requiredDatabaseUrl();
  const useTls = process.env.DATABASE_SSL === "true";
  const connectionLimit = Number(process.env.DATABASE_CONNECTION_LIMIT ?? 10);
  const tlsCa = process.env.DATABASE_SSL_CA_PATH;

  pool = createPool({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    waitForConnections: true,
    connectionLimit: Number.isFinite(connectionLimit) && connectionLimit > 0 ? connectionLimit : 10,
    connectTimeout: 5000,
    enableKeepAlive: true,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: useTls ? {
      rejectUnauthorized: true,
      ...(tlsCa ? { ca: readFileSync(tlsCa, "utf8") } : {})
    } : undefined
  });

  return pool;
}

export async function checkMariaDbConnection(): Promise<void> {
  await getMariaDbPool().query({
    sql: "SELECT tr.id, tr.global_id, au.id FROM test_responses tr LEFT JOIN admin_users au ON 1 = 0 LIMIT 1",
    timeout: 5000
  });
}

export async function closeMariaDbPool(): Promise<void> {
  if (!pool) return;
  const activePool = pool;
  pool = null;
  await activePool.end();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function initializeMariaDb(options: { seed?: boolean } = {}): Promise<void> {
  const db = getMariaDbPool();
  const schema = [
    `CREATE TABLE IF NOT EXISTS zones (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      display_order INT NOT NULL DEFAULT 0
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS centers (
      id VARCHAR(191) PRIMARY KEY,
      no INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      zone_id VARCHAR(191) NOT NULL,
      CONSTRAINT fk_centers_zone FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE RESTRICT,
      UNIQUE KEY uq_centers_zone_name (zone_id, name),
      KEY idx_centers_zone (zone_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      gender_scope VARCHAR(16) NOT NULL DEFAULT 'All',
      zone_id VARCHAR(191) NULL,
      center_id VARCHAR(191) NULL,
      is_active TINYINT(1) NOT NULL,
      last_login_at VARCHAR(64) NULL,
      created_at VARCHAR(64) NULL,
      KEY idx_admin_users_scope (gender_scope, role, zone_id, center_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS test_responses (
      id VARCHAR(191) PRIMARY KEY,
      participant_name VARCHAR(255) NOT NULL,
      global_id VARCHAR(191) NULL,
      age INT NOT NULL,
      gender VARCHAR(16) NOT NULL,
      zone_id VARCHAR(191) NOT NULL,
      center_id VARCHAR(191) NOT NULL,
      score_m INT NOT NULL,
      score_a INT NOT NULL,
      score_s INT NOT NULL,
      score_t INT NOT NULL,
      primary_type CHAR(1) NOT NULL,
      secondary_type CHAR(1) NOT NULL,
      sequence VARCHAR(32) NOT NULL,
      submitted_at VARCHAR(64) NOT NULL,
      valid VARCHAR(16) NULL,
      second_test_yes_count INT NULL,
      second_test_primary_type CHAR(1) NULL,
      second_test_is_valid TINYINT(1) NULL,
      service_priority_1 VARCHAR(255) NULL,
      service_priority_2 VARCHAR(255) NULL,
      service_priority_3 VARCHAR(255) NULL,
      CONSTRAINT fk_test_responses_zone FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE RESTRICT,
      CONSTRAINT fk_test_responses_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE RESTRICT,
      KEY idx_test_responses_submitted (submitted_at),
      KEY idx_test_responses_zone (zone_id),
      KEY idx_test_responses_center (center_id),
      KEY idx_test_responses_type (primary_type)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS test_response_answers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      test_response_id VARCHAR(191) NOT NULL,
      block_number INT NOT NULL,
      most CHAR(1) NOT NULL,
      least CHAR(1) NOT NULL,
      CONSTRAINT fk_test_response_answers_response FOREIGN KEY (test_response_id) REFERENCES test_responses(id) ON DELETE CASCADE,
      KEY idx_test_response_answers_response (test_response_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS test_response_second_answers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      test_response_id VARCHAR(191) NOT NULL,
      question_index INT NOT NULL,
      answer_value TINYINT(1) NOT NULL,
      CONSTRAINT fk_test_response_second_answers_response FOREIGN KEY (test_response_id) REFERENCES test_responses(id) ON DELETE CASCADE,
      KEY idx_test_response_second_answers_response (test_response_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS second_test_statements (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      mast_type CHAR(1) NOT NULL,
      question_index INT NOT NULL,
      statement_text TEXT NOT NULL,
      UNIQUE KEY uq_second_test_statement (mast_type, question_index)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS metadata (
      exported_at VARCHAR(64) NOT NULL,
      total_zones INT NOT NULL,
      total_centers INT NOT NULL,
      total_admin_users INT NOT NULL,
      total_test_responses INT NOT NULL,
      total_answers INT NOT NULL,
      total_second_answers INT NOT NULL
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  ];

  for (const statement of schema) await db.query(statement);
  await db.query("ALTER TABLE test_responses ADD COLUMN IF NOT EXISTS global_id VARCHAR(191) NULL");
  if (options.seed === false) return;

  const zoneSeeds = new Map<string, string>();
  CENTER_SEEDS.forEach((seed) => zoneSeeds.set(`zone-${slug(seed.zone)}`, seed.zone));

  for (const [id, name] of zoneSeeds.entries()) {
    await db.execute(
      "INSERT INTO zones (id, name, display_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), display_order = VALUES(display_order)",
      [id, name, Array.from(zoneSeeds.keys()).indexOf(id)]
    );
  }
  for (const seed of CENTER_SEEDS) {
    await db.execute(
      "INSERT INTO centers (id, no, name, zone_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE no = VALUES(no), name = VALUES(name), zone_id = VALUES(zone_id)",
      [`center-${seed.no}`, seed.no, seed.center, `zone-${slug(seed.zone)}`]
    );
  }
  for (const type of ["M", "A", "S", "T"] as MastType[]) {
    for (const [questionIndex, statementText] of SECOND_TEST_STATEMENTS[type].entries()) {
      await db.execute(
        "INSERT INTO second_test_statements (mast_type, question_index, statement_text) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE statement_text = VALUES(statement_text)",
        [type, questionIndex, statementText]
      );
    }
  }
}

export async function mariaDbTableCounts(tableNames: string[]): Promise<Record<string, number>> {
  const db = getMariaDbPool();
  const result: Record<string, number> = {};
  for (const tableName of tableNames) {
    const [rows] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM \`${tableName}\``);
    result[tableName] = Number(rows[0]?.total ?? 0);
  }
  return result;
}

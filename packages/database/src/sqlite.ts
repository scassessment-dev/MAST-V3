import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient, type Client } from "@libsql/client";
import {
  CENTER_SEEDS,
  scoreSecondTest,
  type BlockAnswer,
  type MastScore,
  type MastType
} from "@mast/core";
import type { AdminRole, AdminSession } from "./auth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CenterRecord = {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  no: number;
};

export type ZoneWithCenters = {
  id: string;
  name: string;
  centers: Array<{ id: string; name: string }>;
};

export type TestResponseRecord = MastScore & {
  id: string;
  participantName: string;
  age: number;
  gender: "Male" | "Female";
  zoneId: string;
  centerId: string;
  answers: BlockAnswer[];
  submittedAt: Date;
  center: { name: string; zone: { name: string } };
  valid: "Valid" | "Invalid" | null;
  secondTestAnswers: boolean[] | null;
  secondTestPrimaryType: MastType | null;
  servicePriorities: string[];
};

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  genderScope: "Male" | "Female" | "All";
  zoneId: string | null;
  centerId: string | null;
  isActive: boolean;
};

export type ResponseFilters = {
  search?: string;
  zoneId?: string;
  centerId?: string;
  primaryType?: string;
  secondaryType?: string;
  gender?: string;
  valid?: string;
  from?: Date;
  to?: Date;
};

// ─── DB singleton ─────────────────────────────────────────────────────────────

let _db: Client | null = null;

function getDbUrl(): string {
  const envPath = process.env.DATABASE_PATH;
  const filePath = envPath ? resolve(envPath) : resolve(join(process.cwd(), "..", "..", "data", "mast.sqlite"));
  if (!existsSync(filePath)) {
    mkdirSync(resolve(filePath, ".."), { recursive: true });
  }
  return `file:${filePath}`;
}

function db(): Client {
  if (_db) return _db;
  _db = createClient({ url: getDbUrl() });
  return _db;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function slugId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function zoneIdFor(name: string): string {
  return `zone-${slugId(name)}`;
}

export function centerIdFor(no: number): string {
  return `center-${no}`;
}

export function seedCenterRecords(): CenterRecord[] {
  return CENTER_SEEDS.map((seed) => ({
    id: centerIdFor(seed.no),
    name: seed.center,
    zoneId: zoneIdFor(seed.zone),
    zoneName: seed.zone,
    no: seed.no
  }));
}

export function seedZonesWithCenters(): ZoneWithCenters[] {
  const zones = new Map<string, ZoneWithCenters>();
  for (const center of seedCenterRecords()) {
    const zone = zones.get(center.zoneId) ?? { id: center.zoneId, name: center.zoneName, centers: [] };
    zone.centers.push({ id: center.id, name: center.name });
    zones.set(center.zoneId, zone);
  }
  return Array.from(zones.values())
    .map((zone) => ({ ...zone, centers: zone.centers.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isFirebaseConfigured(): boolean {
  return false;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

type ResponseRow = {
  id: string;
  participant_name: string;
  age: number;
  gender: string;
  zone_id: string;
  center_id: string;
  zone_name: string;
  center_name: string;
  score_m: number;
  score_a: number;
  score_s: number;
  score_t: number;
  primary_type: string;
  secondary_type: string;
  sequence: string;
  submitted_at: string;
  valid: string | null;
  second_test_primary_type: string | null;
  service_priority_1: string | null;
  service_priority_2: string | null;
  service_priority_3: string | null;
};

type AnswerRow = {
  test_response_id: string;
  block_number: number;
  most: string;
  least: string;
};

type SecondAnswerRow = {
  test_response_id: string;
  question_index: number;
  answer_value: number;
};

function rowToRecord(row: ResponseRow, answers: BlockAnswer[], secondAnswers: boolean[] | null): TestResponseRecord {
  return {
    id: row.id,
    participantName: row.participant_name,
    age: row.age,
    gender: row.gender as "Male" | "Female",
    zoneId: row.zone_id,
    centerId: row.center_id,
    answers,
    scoreM: row.score_m,
    scoreA: row.score_a,
    scoreS: row.score_s,
    scoreT: row.score_t,
    primaryType: row.primary_type as MastType,
    secondaryType: row.secondary_type as MastType,
    sequence: row.sequence,
    submittedAt: new Date(row.submitted_at),
    center: { name: row.center_name, zone: { name: row.zone_name } },
    valid: (row.valid as "Valid" | "Invalid" | null) ?? null,
    secondTestAnswers: secondAnswers,
    secondTestPrimaryType: (row.second_test_primary_type as MastType | null) ?? null,
    servicePriorities: [row.service_priority_1, row.service_priority_2, row.service_priority_3].filter(
      (value): value is string => Boolean(value)
    )
  };
}

async function loadAnswersForResponse(id: string): Promise<BlockAnswer[]> {
  const rs = await db().execute({
    sql: "SELECT test_response_id, block_number, most, least FROM test_response_answers WHERE test_response_id = ? ORDER BY block_number",
    args: [id]
  });
  const rows = rs.rows as unknown as AnswerRow[];
  return rows.map((r) => ({ blockNumber: r.block_number, most: r.most as "A" | "B" | "C" | "D", least: r.least as "A" | "B" | "C" | "D" }));
}

async function loadSecondAnswersForResponse(id: string): Promise<boolean[] | null> {
  const rs = await db().execute({
    sql: "SELECT question_index, answer_value FROM test_response_second_answers WHERE test_response_id = ? ORDER BY question_index",
    args: [id]
  });
  const rows = rs.rows as unknown as SecondAnswerRow[];
  if (rows.length === 0) return null;
  return rows.map((r) => r.answer_value === 1);
}

// ─── Scope and filter helpers ─────────────────────────────────────────────────

function buildScopeWhereClause(session: AdminSession): { where: string; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (session.genderScope && session.genderScope !== "All") {
    clauses.push("tr.gender = ?");
    params.push(session.genderScope);
  }
  if (session.role === "ZONE_ADMIN" && session.zoneId) {
    clauses.push("tr.zone_id = ?");
    params.push(session.zoneId);
  } else if (session.role === "CENTER_ADMIN" && session.centerId) {
    clauses.push("tr.center_id = ?");
    params.push(session.centerId);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

function buildFilterWhereClause(filters: ResponseFilters, existingParams: (string | number)[]): { whereParts: string[]; params: (string | number)[] } {
  const parts: string[] = [];
  const params = [...existingParams];

  if (filters.search) {
    parts.push("tr.participant_name LIKE ?");
    params.push(`%${filters.search}%`);
  }
  if (filters.zoneId) {
    parts.push("tr.zone_id = ?");
    params.push(filters.zoneId);
  }
  if (filters.centerId) {
    parts.push("tr.center_id = ?");
    params.push(filters.centerId);
  }
  if (filters.primaryType) {
    parts.push("tr.primary_type = ?");
    params.push(filters.primaryType);
  }
  if (filters.secondaryType) {
    parts.push("tr.secondary_type = ?");
    params.push(filters.secondaryType);
  }
  if (filters.gender) {
    parts.push("tr.gender = ?");
    params.push(filters.gender);
  }
  if (filters.valid === "Valid") {
    parts.push("tr.valid = 'Valid'");
  } else if (filters.valid === "Invalid") {
    parts.push("tr.valid = 'Invalid'");
  } else if (filters.valid === "Pending") {
    parts.push("tr.valid IS NULL");
  }
  if (filters.from) {
    parts.push("tr.submitted_at >= ?");
    params.push(filters.from.toISOString());
  }
  if (filters.to) {
    parts.push("tr.submitted_at <= ?");
    params.push(filters.to.toISOString());
  }

  return { whereParts: parts, params };
}

function buildResponseWhere(session: AdminSession, filters: ResponseFilters): { where: string; params: (string | number)[] } {
  const { where: scopeWhere, params: scopeParams } = buildScopeWhereClause(session);
  const { whereParts: filterParts, params: allParams } = buildFilterWhereClause(filters, scopeParams);

  const allParts = scopeWhere
    ? [`${scopeWhere}`, ...filterParts.map((p) => `AND ${p}`)]
    : filterParts.length
      ? [`WHERE ${filterParts[0]}`, ...filterParts.slice(1).map((p) => `AND ${p}`)]
      : [];

  return { where: allParts.join(" "), params: allParams };
}

function buildFullQuery(session: AdminSession, filters: ResponseFilters): { sql: string; params: (string | number)[] } {
  const { where, params } = buildResponseWhere(session, filters);
  const sql = `
    SELECT
      tr.*,
      z.name AS zone_name,
      c.name AS center_name
    FROM test_responses tr
    JOIN zones z ON z.id = tr.zone_id
    JOIN centers c ON c.id = tr.center_id
    ${where}
    ORDER BY tr.submitted_at DESC
  `;
  return { sql, params };
}

// ─── Public API — matches V2 firestore.ts exports exactly ─────────────────────

export async function listZonesWithCenters(): Promise<ZoneWithCenters[]> {
  const rs = await db().execute(`
    SELECT z.id AS zone_id, z.name AS zone_name, c.id AS center_id, c.name AS center_name
    FROM zones z
    JOIN centers c ON c.zone_id = z.id
    ORDER BY z.name, c.name
  `);
  const rows = rs.rows as unknown as { zone_id: string; zone_name: string; center_id: string; center_name: string }[];

  const zones = new Map<string, ZoneWithCenters>();
  for (const row of rows) {
    const zone = zones.get(row.zone_id) ?? { id: row.zone_id, name: row.zone_name, centers: [] };
    zone.centers.push({ id: row.center_id, name: row.center_name });
    zones.set(row.zone_id, zone);
  }
  return Array.from(zones.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCenterById(centerId: string): Promise<CenterRecord | null> {
  const rs = await db().execute({
    sql: `
      SELECT c.id, c.no, c.name, c.zone_id, z.name AS zone_name
      FROM centers c
      JOIN zones z ON z.id = c.zone_id
      WHERE c.id = ?
    `,
    args: [centerId]
  });

  const row = rs.rows[0] as unknown as { id: string; no: number; name: string; zone_id: string; zone_name: string } | undefined;
  if (!row) return null;
  return { id: row.id, no: row.no, name: row.name, zoneId: row.zone_id, zoneName: row.zone_name };
}

export async function createTestResponse(input: {
  participantName: string;
  age: number;
  gender: "Male" | "Female";
  center: CenterRecord;
  answers: BlockAnswer[];
  score: MastScore;
}): Promise<TestResponseRecord> {
  const id = randomUUID();
  const submittedAt = new Date().toISOString();

  const statements = [
    {
      sql: `
        INSERT INTO test_responses (
          id, participant_name, age, gender, zone_id, center_id,
          score_m, score_a, score_s, score_t,
          primary_type, secondary_type, sequence,
          submitted_at, valid, second_test_yes_count, second_test_primary_type, second_test_is_valid
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, NULL, NULL, NULL, NULL
        )
      `,
      args: [
        id,
        input.participantName,
        input.age,
        input.gender,
        input.center.zoneId,
        input.center.id,
        input.score.scoreM,
        input.score.scoreA,
        input.score.scoreS,
        input.score.scoreT,
        input.score.primaryType,
        input.score.secondaryType,
        input.score.sequence,
        submittedAt
      ]
    },
    ...input.answers.map((ans) => ({
      sql: "INSERT INTO test_response_answers (test_response_id, block_number, most, least) VALUES (?, ?, ?, ?)",
      args: [id, ans.blockNumber, ans.most, ans.least]
    }))
  ];

  await db().batch(statements, "write");

  return {
    id,
    participantName: input.participantName,
    age: input.age,
    gender: input.gender,
    zoneId: input.center.zoneId,
    centerId: input.center.id,
    answers: input.answers,
    scoreM: input.score.scoreM,
    scoreA: input.score.scoreA,
    scoreS: input.score.scoreS,
    scoreT: input.score.scoreT,
    primaryType: input.score.primaryType,
    secondaryType: input.score.secondaryType,
    sequence: input.score.sequence,
    submittedAt: new Date(submittedAt),
    center: { name: input.center.name, zone: { name: input.center.zoneName } },
    valid: null,
    secondTestAnswers: null,
    secondTestPrimaryType: null,
    servicePriorities: []
  };
}

export async function getTestResponseById(id: string): Promise<TestResponseRecord | null> {
  const rs = await db().execute({
    sql: `
      SELECT
        tr.*,
        z.name AS zone_name,
        c.name AS center_name
      FROM test_responses tr
      JOIN zones z ON z.id = tr.zone_id
      JOIN centers c ON c.id = tr.center_id
      WHERE tr.id = ?
    `,
    args: [id]
  });

  const row = rs.rows[0] as unknown as ResponseRow | undefined;
  if (!row) return null;

  const answers = await loadAnswersForResponse(id);
  const secondAnswers = await loadSecondAnswersForResponse(id);
  return rowToRecord(row, answers, secondAnswers);
}

export async function findAdminByEmail(email: string): Promise<AdminUserRecord | null> {
  const rs = await db().execute({
    sql: `
      SELECT id, name, email, password_hash, role, gender_scope, zone_id, center_id, is_active
      FROM admin_users
      WHERE LOWER(email) = ?
      LIMIT 1
    `,
    args: [email.toLowerCase()]
  });

  const row = rs.rows[0] as unknown as {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    gender_scope: string;
    zone_id: string | null;
    center_id: string | null;
    is_active: number;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as AdminRole,
    genderScope: (row.gender_scope as "Male" | "Female" | "All") ?? "All",
    zoneId: row.zone_id ?? null,
    centerId: row.center_id ?? null,
    isActive: row.is_active === 1
  };
}

export async function listResponsesForAdmin(
  session: AdminSession,
  filters: ResponseFilters = {},
  page = 1,
  pageSize = 25
): Promise<{ total: number; page: number; pageSize: number; rows: TestResponseRecord[] }> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(Math.max(1, Math.floor(pageSize)), 100);
  const { where, params } = buildResponseWhere(session, filters);
  const countResult = await db().execute({
    sql: `SELECT COUNT(*) AS total FROM test_responses tr ${where}`,
    args: params
  });
  const total = Number((countResult.rows[0] as unknown as { total: number | string }).total ?? 0);
  const { sql, params: queryParams } = buildFullQuery(session, filters);
  const rs = await db().execute({
    sql: `${sql} LIMIT ? OFFSET ?`,
    args: [...queryParams, safePageSize, (safePage - 1) * safePageSize]
  });
  const responseRows = rs.rows as unknown as ResponseRow[];
  const rows: TestResponseRecord[] = [];
  for (const row of responseRows) {
    const answers = await loadAnswersForResponse(row.id);
    const secondAnswers = await loadSecondAnswersForResponse(row.id);
    rows.push(rowToRecord(row, answers, secondAnswers));
  }
  return {
    total,
    page: safePage,
    pageSize: safePageSize,
    rows
  };
}

export async function allScopedResponses(session: AdminSession, filters: ResponseFilters = {}): Promise<TestResponseRecord[]> {
  const { sql, params } = buildFullQuery(session, filters);
  const rs = await db().execute({ sql, args: params });
  const rows = rs.rows as unknown as ResponseRow[];

  const results: TestResponseRecord[] = [];
  for (const row of rows) {
    const answers = await loadAnswersForResponse(row.id);
    const secondAnswers = await loadSecondAnswersForResponse(row.id);
    results.push(rowToRecord(row, answers, secondAnswers));
  }
  return results;
}

export async function getScopedResponseById(session: AdminSession, id: string): Promise<TestResponseRecord | null> {
  const response = await getTestResponseById(id);
  if (!response) return null;

  // Gender scope check
  if (session.genderScope && session.genderScope !== "All") {
    if (response.gender !== session.genderScope) return null;
  }
  // Role scope check
  if (session.role === "ZONE_ADMIN" && response.zoneId !== session.zoneId) return null;
  if (session.role === "CENTER_ADMIN" && response.centerId !== session.centerId) return null;

  return response;
}

export async function getDashboardData(session: AdminSession): Promise<{
  total: number;
  byType: Array<{ primaryType: MastType; _count: number }>;
  latest: TestResponseRecord[];
}> {
  const { where, params } = buildResponseWhere(session, {});
  const [totalResult, typeResult, latest] = await Promise.all([
    db().execute({ sql: `SELECT COUNT(*) AS total FROM test_responses tr ${where}`, args: params }),
    db().execute({
      sql: `SELECT tr.primary_type, COUNT(*) AS count FROM test_responses tr ${where} GROUP BY tr.primary_type`,
      args: params
    }),
    listResponsesForAdmin(session, {}, 1, 25)
  ]);
  return {
    total: Number((totalResult.rows[0] as unknown as { total: number | string }).total ?? 0),
    byType: (typeResult.rows as unknown as Array<{ primary_type: string; count: number | string }>).map((row) => ({
      primaryType: row.primary_type as MastType,
      _count: Number(row.count)
    })),
    latest: latest.rows
  };
}

export async function deleteResponsesByIds(session: AdminSession, ids: string[]): Promise<number> {
  let deleted = 0;

  for (const id of ids) {
    const rs = await db().execute({
      sql: "SELECT id, gender, zone_id, center_id FROM test_responses WHERE id = ?",
      args: [id]
    });
    const row = rs.rows[0] as unknown as { id: string; gender: string; zone_id: string; center_id: string } | undefined;
    if (!row) continue;

    const genderMatch = !session.genderScope || session.genderScope === "All" || row.gender === session.genderScope;
    const roleMatch =
      session.role === "MASTER_ADMIN" ||
      (session.role === "ZONE_ADMIN" && row.zone_id === session.zoneId) ||
      (session.role === "CENTER_ADMIN" && row.center_id === session.centerId);

    if (genderMatch && roleMatch) {
      await db().execute({ sql: "DELETE FROM test_responses WHERE id = ?", args: [id] });
      deleted++;
    }
  }

  return deleted;
}

export async function updateResponseValidation(
  id: string,
  data: { secondTestAnswers: boolean[]; servicePriorities: string[] }
): Promise<TestResponseRecord | null> {
  const existing = await getTestResponseById(id);
  if (!existing || existing.valid) return existing;

  const scored = scoreSecondTest(data.secondTestAnswers);
  const valid = scored.isValid ? "Valid" : "Invalid";
  const update = await db().execute({
    sql: `
      UPDATE test_responses
      SET valid = ?,
          second_test_yes_count = ?,
          second_test_primary_type = primary_type,
          second_test_is_valid = ?,
          service_priority_1 = ?,
          service_priority_2 = ?,
          service_priority_3 = ?
      WHERE id = ? AND valid IS NULL
    `,
    args: [
      valid,
      scored.yesCount,
      scored.isValid ? 1 : 0,
      data.servicePriorities[0] ?? null,
      data.servicePriorities[1] ?? null,
      data.servicePriorities[2] ?? null,
      id
    ]
  });

  if (update.rowsAffected === 0) return getTestResponseById(id);

  await db().batch([
    { sql: "DELETE FROM test_response_second_answers WHERE test_response_id = ?", args: [id] },
    ...data.secondTestAnswers.map((value, index) => ({
      sql: "INSERT INTO test_response_second_answers (test_response_id, question_index, answer_value) VALUES (?, ?, ?)",
      args: [id, index, value ? 1 : 0]
    }))
  ], "write");

  return getTestResponseById(id);
}

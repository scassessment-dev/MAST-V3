import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CENTER_SEEDS, type BlockAnswer, type MastScore, type MastType } from "@mast/core";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import type { AdminRole, AdminSession } from "./auth";

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

const memoryResponses = new Map<string, TestResponseRecord>();
const previewStorePath = join(tmpdir(), "mast-preview-responses.json");

export function slugId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
    .map((zone) => ({
      ...zone,
      centers: zone.centers.sort((left, right) => left.name.localeCompare(right.name))
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

function db() {
  if (!isFirebaseConfigured()) return null;

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
      })
    });
  }

  return getFirestore();
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return value ? new Date(String(value)) : new Date();
}

function recordFromSeedId(id: string): CenterRecord | null {
  const no = Number(id.replace(/^seed-/, "").replace(/^center-/, ""));
  const seed = CENTER_SEEDS.find((item) => item.no === no);
  if (!seed) return null;
  return {
    id: centerIdFor(seed.no),
    name: seed.center,
    zoneId: zoneIdFor(seed.zone),
    zoneName: seed.zone,
    no: seed.no
  };
}

function responseFromDoc(id: string, data: FirebaseFirestore.DocumentData): TestResponseRecord {
  return {
    id,
    participantName: data.participantName,
    age: data.age,
    gender: (data.gender as "Male" | "Female") ?? "Male",
    zoneId: data.zoneId,
    centerId: data.centerId,
    answers: data.answers ?? [],
    scoreM: data.scoreM,
    scoreA: data.scoreA,
    scoreS: data.scoreS,
    scoreT: data.scoreT,
    primaryType: data.primaryType,
    secondaryType: data.secondaryType,
    sequence: data.sequence,
    submittedAt: asDate(data.submittedAt),
    center: {
      name: data.centerName,
      zone: { name: data.zoneName }
    },
    valid: (data.valid as "Valid" | "Invalid" | null) ?? null,
    secondTestAnswers: (data.secondTestAnswers as boolean[] | null) ?? null
  };
}

async function readPreviewResponses(): Promise<Map<string, TestResponseRecord>> {
  try {
    const raw = await readFile(previewStorePath, "utf8");
    const rows = JSON.parse(raw) as TestResponseRecord[];
    return new Map(
      rows.map((row) => [
        row.id,
        {
          ...row,
          submittedAt: asDate(row.submittedAt)
        }
      ])
    );
  } catch {
    return new Map();
  }
}

async function writePreviewResponses(rows: Map<string, TestResponseRecord>): Promise<void> {
  await writeFile(previewStorePath, JSON.stringify(Array.from(rows.values()), null, 2), "utf8");
}

function applyScope(response: TestResponseRecord, session: AdminSession): boolean {
  if (session.genderScope && session.genderScope !== "All" && response.gender) {
    if (response.gender !== session.genderScope) return false;
  }
  if (session.role === "MASTER_ADMIN") return true;
  if (session.role === "ZONE_ADMIN") return response.zoneId === session.zoneId;
  return response.centerId === session.centerId;
}

function applyFilters(response: TestResponseRecord, filters: ResponseFilters = {}): boolean {
  if (filters.search && !response.participantName.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (filters.zoneId && response.zoneId !== filters.zoneId) return false;
  if (filters.centerId && response.centerId !== filters.centerId) return false;
  if (filters.primaryType && response.primaryType !== filters.primaryType) return false;
  if (filters.secondaryType && response.secondaryType !== filters.secondaryType) return false;
  if (filters.gender && response.gender !== filters.gender) return false;
  if (filters.valid) {
    if (filters.valid === "Valid" && response.valid !== "Valid") return false;
    if (filters.valid === "Invalid" && response.valid !== "Invalid") return false;
    if (filters.valid === "Pending" && response.valid !== null) return false;
  }
  if (filters.from && response.submittedAt < filters.from) return false;
  if (filters.to && response.submittedAt > filters.to) return false;
  return true;
}

export async function listZonesWithCenters(): Promise<ZoneWithCenters[]> {
  const firestore = db();
  if (!firestore) return seedZonesWithCenters();

  const centers = await firestore.collection("centers").get();
  if (centers.empty) return seedZonesWithCenters();

  const zones = new Map<string, ZoneWithCenters>();
  centers.forEach((doc) => {
    const data = doc.data();
    const zoneId = data.zoneId;
    const zone =
      zones.get(zoneId) ??
      ({
        id: zoneId,
        name: data.zoneName,
        centers: [] as Array<{ id: string; name: string }>
      } satisfies ZoneWithCenters);
    zone.centers.push({ id: doc.id, name: data.name });
    zones.set(zoneId, zone);
  });

  return Array.from(zones.values())
    .map((zone) => ({
      ...zone,
      centers: zone.centers.sort((left, right) => left.name.localeCompare(right.name))
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getCenterById(centerId: string): Promise<CenterRecord | null> {
  const normalizedSeed = centerId.startsWith("seed-") ? recordFromSeedId(centerId) : null;
  if (normalizedSeed && !db()) return normalizedSeed;

  const firestore = db();
  if (!firestore) return recordFromSeedId(centerId);

  const doc = await firestore.collection("centers").doc(centerId).get();
  if (!doc.exists) return normalizedSeed ?? recordFromSeedId(centerId);
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    zoneId: data.zoneId,
    zoneName: data.zoneName,
    no: data.no
  };
}

export async function createTestResponse(input: {
  participantName: string;
  age: number;
  gender: "Male" | "Female";
  center: CenterRecord;
  answers: BlockAnswer[];
  score: MastScore;
}): Promise<TestResponseRecord> {
  const submittedAt = new Date();
  const firestore = db();
  const id = firestore ? randomUUID() : `preview-${randomUUID()}`;
  const record: TestResponseRecord = {
    id,
    participantName: input.participantName,
    age: input.age,
    gender: input.gender,
    zoneId: input.center.zoneId,
    centerId: input.center.id,
    answers: input.answers,
    submittedAt,
    center: { name: input.center.name, zone: { name: input.center.zoneName } },
    valid: null,
    secondTestAnswers: null,
    ...input.score
  };

  if (!firestore) {
    memoryResponses.set(id, record);
    const persisted = await readPreviewResponses();
    persisted.set(id, record);
    await writePreviewResponses(persisted);
    return record;
  }

  await firestore.collection("testResponses").doc(id).set({
    participantName: record.participantName,
    age: record.age,
    gender: record.gender,
    zoneId: record.zoneId,
    zoneName: record.center.zone.name,
    centerId: record.centerId,
    centerName: record.center.name,
    answers: record.answers,
    scoreM: record.scoreM,
    scoreA: record.scoreA,
    scoreS: record.scoreS,
    scoreT: record.scoreT,
    primaryType: record.primaryType,
    secondaryType: record.secondaryType,
    sequence: record.sequence,
    valid: null,
    secondTestAnswers: null,
    submittedAt: FieldValue.serverTimestamp()
  });

  return record;
}

export async function getTestResponseById(id: string): Promise<TestResponseRecord | null> {
  const memory = memoryResponses.get(id);
  if (memory) return memory;

  const firestore = db();
  if (!firestore) {
    const persisted = await readPreviewResponses();
    return persisted.get(id) ?? null;
  }

  const doc = await firestore.collection("testResponses").doc(id).get();
  if (!doc.exists) return null;
  return responseFromDoc(doc.id, doc.data()!);
}

export async function findAdminByEmail(email: string): Promise<AdminUserRecord | null> {
  const firestore = db();
  if (!firestore) return null;

  const snapshot = await firestore.collection("adminUsers").where("email", "==", email.toLowerCase()).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    genderScope: (data.genderScope as "Male" | "Female" | "All") ?? "All",
    zoneId: data.zoneId ?? null,
    centerId: data.centerId ?? null,
    isActive: Boolean(data.isActive)
  };
}

export async function listResponsesForAdmin(
  session: AdminSession,
  filters: ResponseFilters = {},
  page = 1,
  pageSize = 25
): Promise<{ total: number; page: number; pageSize: number; rows: TestResponseRecord[] }> {
  const all = await allScopedResponses(session, filters);
  return {
    total: all.length,
    page,
    pageSize,
    rows: all.slice((page - 1) * pageSize, page * pageSize)
  };
}

export async function allScopedResponses(session: AdminSession, filters: ResponseFilters = {}): Promise<TestResponseRecord[]> {
  const firestore = db();
  if (!firestore) {
    const persisted = await readPreviewResponses();
    for (const [id, response] of persisted.entries()) memoryResponses.set(id, response);
    return Array.from(memoryResponses.values())
      .filter((response) => applyScope(response, session) && applyFilters(response, filters))
      .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime());
  }

  const snapshot = await firestore.collection("testResponses").orderBy("submittedAt", "desc").get();
  return snapshot.docs
    .map((doc) => responseFromDoc(doc.id, doc.data()))
    .filter((response) => applyScope(response, session) && applyFilters(response, filters));
}

export async function getScopedResponseById(session: AdminSession, id: string): Promise<TestResponseRecord | null> {
  const response = await getTestResponseById(id);
  if (!response || !applyScope(response, session)) return null;
  return response;
}

export async function getDashboardData(session: AdminSession): Promise<{
  total: number;
  byType: Array<{ primaryType: MastType; _count: number }>;
  latest: TestResponseRecord[];
}> {
  const responses = await allScopedResponses(session);
  const counts = new Map<MastType, number>();
  for (const response of responses) {
    counts.set(response.primaryType, (counts.get(response.primaryType) ?? 0) + 1);
  }
  return {
    total: responses.length,
    byType: Array.from(counts.entries()).map(([primaryType, count]) => ({ primaryType, _count: count })),
    latest: responses.slice(0, 25)
  };
}

export async function deleteResponsesByIds(session: AdminSession, ids: string[]): Promise<number> {
  const firestore = db();

  if (!firestore) {
    // Preview (no-Firebase) mode — clean from tmp + memory stores
    const persisted = await readPreviewResponses();
    let deleted = 0;
    for (const id of ids) {
      const response = persisted.get(id) ?? memoryResponses.get(id);
      if (response && applyScope(response, session)) {
        persisted.delete(id);
        memoryResponses.delete(id);
        deleted++;
      }
    }
    await writePreviewResponses(persisted);
    return deleted;
  }

  // Firestore mode — server-side scope verification before each delete
  let deleted = 0;
  const CHUNK_SIZE = 200; // Stay well within Firestore batch limit of 500

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const batch = firestore.batch();

    for (const id of chunk) {
      const docRef = firestore.collection("testResponses").doc(id);
      const doc = await docRef.get();
      if (!doc.exists) continue;
      const data = doc.data()!;

      const genderMatch = !session.genderScope || session.genderScope === "All" || data.gender === session.genderScope;
      const roleMatch =
        session.role === "MASTER_ADMIN" ||
        (session.role === "ZONE_ADMIN" && data.zoneId === session.zoneId) ||
        (session.role === "CENTER_ADMIN" && data.centerId === session.centerId);

      const inScope = genderMatch && roleMatch;

      if (!inScope) continue;
      batch.delete(docRef);
      deleted++;
    }

    await batch.commit();
  }

  return deleted;
}

export async function updateResponseValidation(
  id: string,
  data: { valid: "Valid" | "Invalid"; secondTestAnswers: boolean[] }
): Promise<void> {
  const firestore = db();

  if (!firestore) {
    // Preview mode — update in-memory + file store
    const persisted = await readPreviewResponses();
    const existing = persisted.get(id) ?? memoryResponses.get(id);
    if (existing) {
      const updated = { ...existing, valid: data.valid, secondTestAnswers: data.secondTestAnswers };
      memoryResponses.set(id, updated);
      persisted.set(id, updated);
      await writePreviewResponses(persisted);
    }
    return;
  }

  await firestore.collection("testResponses").doc(id).update({
    valid: data.valid,
    secondTestAnswers: data.secondTestAnswers
  });
}

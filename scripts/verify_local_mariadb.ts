import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  getMariaDbPool, closeMariaDbPool, mariaDbTableCounts,
  getTestResponseById, signAdminSession, adminCookieName,
  updateResponseValidation, type AdminSession
} from "@mast/database";
import { NO_SERVICE_ID } from "@mast/core";

const tables = ["zones", "centers", "admin_users", "test_responses", "test_response_answers", "test_response_second_answers"];

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL ?? "invalid:");
  assert(["127.0.0.1", "localhost"].includes(dbUrl.hostname) && dbUrl.pathname === "/mast_v3_test",
    "Integration checks are restricted to the local mast_v3_test database.");
  const participant = process.env.TEST_PARTICIPANT_URL ?? "http://localhost:3000";
  const admin = process.env.TEST_ADMIN_URL ?? "http://localhost:3001";
  for (const base of [participant, admin]) {
    assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Only local app URLs are permitted.");
  }
  const db = getMariaDbPool();
  const before = await mariaDbTableCounts(tables);
  const adminId = `integration-${randomUUID()}`;
  const email = `${adminId}@local-test.invalid`;
  const password = randomBytes(24).toString("hex");
  let responseId: string | undefined;
  const request = async (base: string, path: string, options: RequestInit = {}) => {
    const result = await fetch(base + path, { ...options, signal: AbortSignal.timeout(30000) });
    assert(result.ok, `${path} returned ${result.status}`);
    return result;
  };
  try {
    for (const base of [participant, admin]) {
      const health = await request(base, "/api/health");
      assert.equal((await health.json()).database, "connected");
    }
    assert.equal((await fetch(admin + "/api/admin/responses")).status, 401);
    const [centers] = await db.query("SELECT id, zone_id FROM centers ORDER BY no LIMIT 1");
    const center = (centers as Array<{ id: string; zone_id: string }>)[0];
    assert(center, "Imported centers must exist.");
    await db.execute(
      "INSERT INTO admin_users (id,name,email,password_hash,role,gender_scope,is_active) VALUES (?,?,?,?,?,?,1)",
      [adminId, "Local integration account", email, await bcrypt.hash(password, 10), "MASTER_ADMIN", "All"]
    );
    assert.equal((await fetch(admin + "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "incorrect" })
    })).status, 401);
    const login = await request(admin, "/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password })
    });
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert(cookie, "Login must issue a session cookie.");
    assert(login.headers.get("set-cookie")?.toLowerCase().includes("secure"), "Production session cookie must be secure.");
    const headers = { Cookie: cookie };
    const testLink = await request(admin, "/take-test", { headers });
    assert((await testLink.text()).includes(participant), "Runtime participant URL must appear in the admin page.");
    const name = `Deployment check ${randomUUID()}`;
    const submitted = await request(participant, "/api/responses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantName: name, globalId: "LOCAL-DEPLOY-CHECK", age: 25, gender: "Male", centerId: center.id,
        answers: Array.from({ length: 10 }, (_, i) => ({ blockNumber: i + 1, most: "A", least: "B" })) })
    });
    responseId = (await submitted.json()).responseId;
    assert(responseId);
    let record = await getTestResponseById(responseId);
    assert.equal(record?.globalId, "LOCAL-DEPLOY-CHECK");
    assert.equal(record?.answers.length, 10);
    assert.equal(record?.valid, null);
    await assert.rejects(updateResponseValidation(responseId, {
      secondTestAnswers: Array(10).fill(true), servicePriorities: ["x".repeat(256)]
    }));
    assert.equal((await getTestResponseById(responseId))?.valid, null, "A failed write must not finalize a result.");
    const finish = () => request(participant, `/api/responses/${responseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secondTestAnswers: Array(10).fill(true), servicePriorities: [NO_SERVICE_ID] })
    });
    await Promise.all([finish(), finish()]);
    record = await getTestResponseById(responseId);
    assert.equal(record?.secondTestAnswers?.length, 10, "Concurrent retries must save exactly 10 answers.");
    const listing = await request(admin, `/api/admin/responses?search=${encodeURIComponent(name)}`, { headers });
    const result = await listing.json();
    assert.equal(result.total, 1);
    assert.equal(result.rows[0].id, responseId);
    const session: AdminSession = { id: adminId, name: "Scope check", email, role: "CENTER_ADMIN", genderScope: "Male", zoneId: center.zone_id, centerId: "not-an-allocated-center" };
    const scoped = { Cookie: `${adminCookieName()}=${await signAdminSession(session)}` };
    const inaccessible = await request(admin, `/api/admin/responses?search=${encodeURIComponent(name)}`, { headers: scoped });
    assert.equal((await inaccessible.json()).total, 0);
    const csv = await request(admin, `/api/admin/responses/export?search=${encodeURIComponent(name)}`, { headers });
    assert((await csv.text()).includes(name));
    const pdf = await request(participant, `/api/responses/${responseId}/pdf`);
    assert.equal(pdf.headers.get("content-type"), "application/pdf");
    assert(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).equals(Buffer.from("%PDF")));
    const deletion = await request(admin, "/api/admin/responses/bulk-delete", {
      method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ ids: [responseId] })
    });
    assert.equal((await deletion.json()).deleted, 1);
    assert.equal(await getTestResponseById(responseId), null);
    console.log("PASS: database health, login, runtime test link, submission, Global ID, rollback, concurrent retries, scope, CSV, Gujarati PDF and deletion.");
  } finally {
    if (responseId) await db.execute("DELETE FROM test_responses WHERE id=?", [responseId]);
    await db.execute("DELETE FROM admin_users WHERE id=?", [adminId]);
    assert.deepEqual(await mariaDbTableCounts(tables), before, "Checks must leave all original record counts unchanged.");
    await closeMariaDbPool();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

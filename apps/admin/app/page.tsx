import { MAST_LABELS, MAST_TYPE_THEME, type MastType } from "@mast/core";
import { getDashboardData, listZonesWithCenters } from "@mast/database";
import { requireAdmin } from "./auth";
import AdminNavigation from "./admin-navigation";
import ResponsesTable from "./responses-table";

export default async function AdminDashboard() {
  const session = await requireAdmin();

  // Fetch dashboard stats + zones for filter dropdowns in parallel
  const [{ total, byType, latest }, zones] = await Promise.all([
    getDashboardData(session),
    listZonesWithCenters()
  ]);

  const counts = Object.fromEntries(byType.map((row) => [row.primaryType, row._count]));

  // Serialize Date objects so they can be passed to the Client Component
  const serializedRows = latest.map((r) => ({
    id: r.id,
    participantName: r.participantName,
    age: r.age,
    gender: r.gender,
    scoreM: r.scoreM,
    scoreA: r.scoreA,
    scoreS: r.scoreS,
    scoreT: r.scoreT,
    primaryType: r.primaryType,
    secondaryType: r.secondaryType,
    submittedAt: r.submittedAt.toISOString(),
    center: r.center,
    valid: r.valid,
    servicePriorities: r.servicePriorities,
  }));

  const sessionInfo = {
    role: session.role,
    zoneId: session.zoneId,
    centerId: session.centerId,
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">

        {/* Header */}
        <div className="panel rounded-3xl p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                {session.role}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-ink">MAST Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">
                {session.name} / {session.email}
              </p>
            </div>
            <AdminNavigation />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Metric label="Total responses" value={total} />
          {(["M", "A", "S", "T"] as MastType[]).map((type) => (
            <Metric
              key={type}
              label={`${type} — ${MAST_LABELS[type].label}`}
              value={counts[type] ?? 0}
              tone={MAST_TYPE_THEME[type].card}
            />
          ))}
        </div>

        {/* Responses table — Client Component with filters + delete */}
        <ResponsesTable
          session={sessionInfo}
          initialRows={serializedRows}
          initialTotal={total}
          zones={zones}
        />

      </section>
    </main>
  );
}

function Metric({ label, value, tone = "border-slate-200 bg-white" }: { label: string; value: number; tone?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

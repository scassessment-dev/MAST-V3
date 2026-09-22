import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceById, getServiceMatchStatus, MAST_LABELS, MAST_STATUS_THEME, MAST_TYPE_THEME, SERVICE_CATALOG, SERVICE_CHANNEL_ORDER, serviceDisplayLabel, serviceMatchLabel, type MastType } from "@mast/core";
import { getScopedResponseById } from "@mast/database";
import { requireAdmin } from "../../auth";

export default async function ResponseDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const response = await getScopedResponseById(session, params.id);
  if (!response) notFound();

  const scores = [
    ["M", response.scoreM],
    ["A", response.scoreA],
    ["S", response.scoreS],
    ["T", response.scoreT]
  ] as Array<[MastType, number]>;
  const candidateServices = SERVICE_CATALOG.filter((service) => service.probablePrimaryType === response.primaryType);
  const groupedServices = SERVICE_CHANNEL_ORDER
    .map((channel) => [channel, candidateServices.filter((service) => service.channel === channel)] as const)
    .filter(([, services]) => services.length > 0);
  const yesCount = response.secondTestAnswers?.filter(Boolean).length;
  const selectedServices = response.servicePriorities.filter(Boolean);

  return (
    <main className="min-h-screen px-4 py-6">
      <section className="panel mx-auto max-w-6xl rounded-3xl p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href="/" className="text-sm font-bold text-blue-700">Back to dashboard</Link>
            <p className="mt-3 text-xs font-bold tracking-[.18em] text-gold">RESPONSE DETAIL</p><h1 className="mt-1 text-3xl font-black text-ink">{response.participantName}</h1>
            <p className="mt-2 break-words text-slate-600">
              {response.center.zone.name} / {response.center.name} / Age {response.age} / {response.gender}
            </p>
          </div>
          <a href={`/api/admin/responses/${response.id}/pdf`} className="rounded-xl bg-ink px-5 py-3 text-center font-bold text-white">
            Download report
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card label="Primary" value={`${response.primaryType} - ${MAST_LABELS[response.primaryType as MastType].label}`} tone={MAST_TYPE_THEME[response.primaryType as MastType].card} />
          <Card label="Secondary" value={`${response.secondaryType} - ${MAST_LABELS[response.secondaryType as MastType].label}`} tone={MAST_TYPE_THEME[response.secondaryType as MastType].card} />
          <Card label="Sequence" value={response.sequence} tone="border-slate-200 bg-slate-50" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card label="Validity" value={response.valid ?? "Pending"} tone={response.valid === "Valid" ? MAST_STATUS_THEME.valid.card : response.valid === "Invalid" ? MAST_STATUS_THEME.invalid.card : MAST_STATUS_THEME.pending.card} />
          <Card label="Second Test" value={response.valid ? `${response.valid} · હા ${yesCount ?? 0}/10` : "Pending"} tone="border-slate-200 bg-slate-50" />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 p-5">
          <p className="text-xs font-bold tracking-[.16em] text-slate-600">MAST PROFILE</p><h2 className="text-xl font-black text-ink">Scores</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {scores.map(([type, score]) => (
              <div key={type} className={`rounded-xl border p-4 ${scoreTone(type)}`}>
                <p className="text-sm font-bold text-slate-500">{type} - {MAST_LABELS[type].label}</p>
                <p className="mt-1 text-3xl font-bold">{score}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-0"><p className="text-sm font-bold tracking-[.14em] text-gold">હાલની સેવાઓ</p><h2 className="text-2xl font-black text-ink">પસંદ કરેલી સેવાઓ</h2></div><p className="max-w-xl text-sm leading-6 text-slate-500">સેવા મેચ માત્ર સંભવિત માર્ગદર્શન છે. વ્યક્તિની આવડત, તૈયારી અને પૂ. સંતનો નિર્ણય વધુ મહત્વનો છે.</p></div>
          {selectedServices.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{selectedServices.map((serviceId, index) => <MatchSummary key={serviceId} priority={index + 1} serviceId={serviceId} primaryType={response.primaryType} valid={response.valid} />)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 font-semibold text-slate-600">આ જૂના responseમાં હાલની સેવા માહિતી ઉપલબ્ધ નથી.</p>}
          <div className="mt-5 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((index) => <ServicePriorityCard key={index} priority={index + 1} serviceId={response.servicePriorities[index]} primaryType={response.primaryType} valid={response.valid} />)}</div>
        </section>

        <section className={`mt-6 rounded-2xl border p-5 ${MAST_TYPE_THEME[response.primaryType as MastType].card}`}>
          <p className="text-sm font-bold tracking-[.14em] text-gold">અનુરૂપ સેવા મેચિંગ</p><h2 className="mt-1 text-2xl font-black text-ink">{response.primaryType} — {MAST_LABELS[response.primaryType].label} માટે અનુરૂપ સેવાઓ</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">ચેનલ પ્રમાણે ગોઠવેલી આ સૂચિ માર્ગદર્શન માટે છે. તમારી હાલની પસંદ કરેલી સેવા અહીં સ્પષ્ટ રીતે highlight થાય છે.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{groupedServices.map(([channel, services]) => <section key={channel} className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-700">{channel}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{services.length} સેવાઓ</span></div><div className="mt-3 space-y-2">{services.map((service) => <CandidateServiceTag key={service.id} serviceId={service.id} label={serviceDisplayLabel(service)} selected={response.servicePriorities.includes(service.id)} primaryType={response.primaryType} valid={response.valid} />)}</div></section>)}</div>
        </section>
      </section>
    </main>
  );
}

function ServicePriorityCard({ priority, serviceId, primaryType, valid }: { priority: number; serviceId?: string; primaryType: MastType; valid: "Valid" | "Invalid" | null }) {
  if (!serviceId) return <div className="min-w-0 rounded-xl border border-dashed border-slate-300 bg-white/60 p-4"><p className="text-sm font-bold text-slate-500">હાલની સેવા {priority}</p><p className="mt-2 font-semibold text-slate-400">માહિતી ઉપલબ્ધ નથી</p></div>;
  const service = getServiceById(serviceId);
  const status = getServiceMatchStatus({ serviceId, primaryType, valid });
  return <div className={`min-w-0 rounded-xl border bg-white p-4 shadow-sm ${status === "matched" ? MAST_STATUS_THEME.matched.card : status === "not_matched" ? MAST_STATUS_THEME.notMatched.card : MAST_STATUS_THEME.pending.card}`}><p className="text-sm font-bold text-slate-500">હાલની સેવા {priority}</p><p className="mt-2 break-words font-bold text-ink">{service ? serviceDisplayLabel(service) : "હાલ કોઈ સેવા નથી"}</p><span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${status === "matched" ? MAST_STATUS_THEME.matched.badge : status === "not_matched" ? MAST_STATUS_THEME.notMatched.badge : MAST_STATUS_THEME.pending.badge}`}>{serviceMatchLabel(status)}</span></div>;
}

function MatchSummary({ priority, serviceId, primaryType, valid }: { priority: number; serviceId: string; primaryType: MastType; valid: "Valid" | "Invalid" | null }) {
  const service = getServiceById(serviceId);
  const status = getServiceMatchStatus({ serviceId, primaryType, valid });
  return <span className={`rounded-full px-3 py-1.5 text-sm font-black ${status === "matched" ? MAST_STATUS_THEME.matched.badge : status === "not_matched" ? MAST_STATUS_THEME.notMatched.badge : MAST_STATUS_THEME.pending.badge}`}>હાલની સેવા {priority}: {service?.shortCode ?? "સેવા"} · {serviceMatchLabel(status)}</span>;
}

function CandidateServiceTag({ serviceId, label, selected, primaryType, valid }: { serviceId: string; label: string; selected: boolean; primaryType: MastType; valid: "Valid" | "Invalid" | null }) {
  const status = getServiceMatchStatus({ serviceId, primaryType, valid });
  const tone = selected && status === "matched" ? MAST_STATUS_THEME.matched.selected : selected && status === "not_matched" ? MAST_STATUS_THEME.notMatched.selected : selected ? "border-slate-300 bg-slate-100 text-slate-800 ring-2 ring-slate-200" : "border-slate-200 bg-white text-slate-700";
  const stateLabel = selected ? serviceMatchLabel(status) : "સૂચિત સેવા";
  return <div className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold ${tone}`}><span className="min-w-0 break-words">{label}</span><span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[11px] font-black">{stateLabel}</span></div>;
}

function scoreTone(type: MastType) { return MAST_TYPE_THEME[type].card; }

function Card({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`min-w-0 rounded-xl border p-5 shadow-sm ${tone}`}>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-xl font-black text-ink">{value}</p>
    </div>
  );
}

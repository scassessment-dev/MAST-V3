import AdminNavigation from "../admin-navigation";
import { requireAdmin } from "../auth";

export const dynamic = "force-dynamic";

function getParticipantSiteUrl(): string {
  const value = process.env.PARTICIPANT_URL ?? process.env.NEXT_PUBLIC_PARTICIPANT_URL;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("PARTICIPANT_URL must be configured for the admin application.");
  }
  const url = new URL(value ?? "http://localhost:3000");
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PARTICIPANT_URL must be an HTTP or HTTPS URL.");
  }
  return url.toString();
}

const instructions = [
  "આ કોઈ પાસ–ફેલ ટેસ્ટ નથી અને તેના આધારે કોઈની યોગ્યતા કે અયોગ્યતા નક્કી થતી નથી.",
  "દરેક જવાબ સામાન્ય દિવસોમાં તમે ખરેખર કેવી રીતે વિચારો કે વર્તો છો તે પ્રમાણે આપવો — શું કરવું જોઈએ એ પ્રમાણે નહીં.",
  "સારો કે ખરાબ જવાબ નથી; તેથી કોઈને ખુશ કરવા, પ્રભાવિત કરવા અથવા ચોક્કસ પરિણામ મેળવવા જવાબ ન આપવો.",
  "હાલની જવાબદારી, સેવા અથવા આસપાસના લોકોના મતને ધ્યાનમાં લીધા વિના પોતાની સ્વાભાવિક પસંદગીથી જવાબ આપવો.",
  "ટેસ્ટ શાંતિથી, એક જ વખતમાં અને શક્ય હોય તો બીજાની સલાહ લીધા વિના પૂર્ણ કરવો.",
  "કોઈ પ્રશ્ન સમજવામાં ટેકનિકલ મદદ જોઈએ તો મદદ માગી શકાય, પરંતુ કયો જવાબ પસંદ કરવો તેની સલાહ ન લેવી.",
  "આ માહિતી વ્યક્તિને વધુ સારી રીતે સમજવા અને યોગ્ય માર્ગદર્શન માટે છે; ચિંતા કરવાની કોઈ જરૂર નથી."
];

export default async function TakeTestPage() {
  await requireAdmin();
  const participantSiteUrl = getParticipantSiteUrl();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="panel rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[.18em] text-gold">PARTICIPANT TEST</p>
              <h1 className="mt-1 text-2xl font-black text-ink">ટેસ્ટ લિંક અને સૂચનાઓ</h1>
            </div>
            <AdminNavigation />
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 shadow-sm sm:p-9">
          <p className="text-sm font-bold tracking-[.18em] text-amber-800">શરૂ કરતાં પહેલાં</p>
          <h2 className="mt-2 max-w-3xl font-serif text-4xl font-extrabold leading-tight text-ink sm:text-5xl">મુખ્ય સૂચનાઓ</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">આ ટૂંકી સૂચનાઓ ટેસ્ટ ભરનાર સભ્યને વાંચવા અથવા સમજાવવા માટે છે.</p>

          <div className="mt-7 grid gap-3">
            {instructions.map((instruction, index) => (
              <div key={instruction} className="flex gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-900">{index + 1}</span>
                <p className="pt-0.5 font-semibold leading-7 text-slate-700">{instruction}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-ink">ટેસ્ટ લિંક</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">સૂચનાઓ સમજાવ્યા પછી આ link ખોલીને ટેસ્ટ ભરનાર સભ્યને ટેસ્ટ શરૂ કરાવો.</p>
            </div>
            <a href={participantSiteUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 font-black text-white shadow-sm transition hover:bg-slate-800">
              ટેસ્ટ ખોલો <span className="ml-2" aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}

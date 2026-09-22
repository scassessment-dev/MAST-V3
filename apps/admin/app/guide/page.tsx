import Link from "next/link";
import { MAST_GUIDES, MAST_TYPE_THEME, MAST_VIVEK_GUIDE, type MastType } from "@mast/core";
import { requireAdmin } from "../auth";
import AdminNavigation from "../admin-navigation";

const types: MastType[] = ["M", "A", "S", "T"];
export default async function GuideLanding() {
  await requireAdmin();
  return <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"><section className="mx-auto max-w-7xl">
    <nav className="flex flex-col gap-4 rounded-3xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">MAST Admin</p><h1 className="text-xl font-black text-ink">MAST Guide</h1></div>
      <AdminNavigation />
    </nav>
    <header className="mt-8 max-w-4xl"><p className="text-sm font-bold tracking-[.2em] text-gold">માર્ગદર્શિકા</p><h2 className="mt-3 font-serif text-4xl font-extrabold text-ink sm:text-5xl"><span className="block leading-[1.15]">પ્રકૃતિને સમજીએ,</span><span className="mt-5 block leading-[1.15] sm:mt-6">વ્યક્તિને બાંધીએ નહીં.</span></h2><p className="mt-6 max-w-3xl text-lg leading-9 text-slate-600">આ માર્ગદર્શિકા પૂ. સંત અને જવાબદાર હરિભક્તોને MAST પરિણામને સંવાદ, વિકાસ અને યોગ્ય સેવા માટે સહાયક રીતે વાપરવા માટે છે.</p></header>
    <div className="mt-8 grid gap-6 md:grid-cols-2">{types.map((type) => { const guide = MAST_GUIDES[type]; const theme = MAST_TYPE_THEME[type]; return <Link key={type} href={`/guide/${type}`} className={`group min-h-[316px] overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} p-6 shadow-sm ring-1 ring-white/70 transition duration-200 hover:-translate-y-1 hover:shadow-xl`}>
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-5"><img src={`/images/mast-types/${type}.png`} alt="" className="h-28 w-28 rounded-2xl bg-white object-cover object-top shadow-lg" /><div className="min-w-0"><span className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${theme.badge}`}>પ્રકાર {type}</span><h3 className="mt-3 break-words font-serif text-3xl font-extrabold leading-[1.35] text-ink">{guide.title}</h3><p className="mt-1 break-words font-bold text-slate-600">{guide.subtitle}</p></div></div>
      <p className="mt-6 border-l-4 border-white pl-4 text-lg font-bold leading-8 text-slate-700">“{guide.quote}”</p>
      <div className="mt-5 flex flex-wrap gap-2">{guide.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-slate-700 shadow-sm">{keyword}</span>)}</div>
    </Link>; })}</div>
    <Link href="/guide/vivek" className="group mt-8 block overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-stone-100 p-1 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="grid gap-6 rounded-[22px] bg-white/45 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
        <div className="min-w-0"><p className="text-sm font-bold tracking-[.18em] text-gold">છેલ્લું માર્ગદર્શન</p><h3 className="mt-2 break-words font-serif text-3xl font-extrabold leading-[1.35] text-ink sm:text-4xl">{MAST_VIVEK_GUIDE.title}</h3><p className="mt-3 max-w-3xl break-words text-lg leading-8 text-slate-600">{MAST_VIVEK_GUIDE.subtitle}</p></div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white shadow-sm transition group-hover:bg-slate-700">વાંચો <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  </section></main>;
}

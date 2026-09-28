import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MAST_GUIDES, MAST_TYPE_THEME, SERVICE_CATALOG, serviceDisplayLabel, type MastGuideSection, type MastType } from "@mast/core";
import { requireAdmin } from "../../auth";
import AdminNavigation from "../../admin-navigation";

const TYPES: MastType[] = ["M", "A", "S", "T"];
const GUIDE_VIDEOS: Record<MastType, { id: string; title: string }> = {
  M: { id: "kxPDx2iF4_M", title: "મિલનસાર પ્રકૃતિનું વિડિયો માર્ગદર્શન" },
  A: { id: "VZKQzptIKeM", title: "આદેશક પ્રકૃતિનું વિડિયો માર્ગદર્શન" },
  S: { id: "kgQhHyvtd4A", title: "સહયોગી પ્રકૃતિનું વિડિયો માર્ગદર્શન" },
  T: { id: "pBD9W5taSe8", title: "તર્કબદ્ધ પ્રકૃતિનું વિડિયો માર્ગદર્શન" }
};
export default async function GuideTypePage({ params }: { params: { type: string } }) {
  await requireAdmin();
  const type = params.type.toUpperCase() as MastType;
  if (!TYPES.includes(type)) notFound();
  const guide = MAST_GUIDES[type];
  const theme = MAST_TYPE_THEME[type];
  const video = GUIDE_VIDEOS[type];
  const serviceTags = SERVICE_CATALOG.filter((service) => service.probablePrimaryType === type);
  const [introduction, recognition, strengths, cautions, workStyle, guidance, doGuidance, dontGuidance, questionGuidance] = guide.sections;
  const displaySections: Array<MastGuideSection & { children?: MastGuideSection[] }> = [
    { ...introduction, title: "પરિચય" },
    { ...recognition, title: "લાક્ષણિકતાઓ" },
    { ...strengths, title: "શક્તિઓ" },
    { ...cautions, title: "નબળાઈઓ" },
    { ...workStyle, title: "કાર્યપદ્ધતિ" },
    { ...guidance, title: "કાર્ય માર્ગદર્શન", children: [doGuidance, dontGuidance, questionGuidance].filter(Boolean) as MastGuideSection[] }
  ];
  return <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"><section className="mx-auto max-w-7xl">
    <nav className="sticky top-3 z-20 flex flex-col gap-3 rounded-3xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-slate-200 backdrop-blur lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-center justify-between gap-3"><Link href="/guide" className="shrink-0 font-bold text-slate-600 hover:text-ink">← Guide</Link><div className="flex min-w-0 gap-1 overflow-x-auto">{TYPES.map((item) => <Link key={item} href={`/guide/${item}`} className={`rounded-lg px-3 py-2 text-sm font-black ${item === type ? MAST_TYPE_THEME[item].badge : "text-slate-500 hover:bg-slate-100"}`}>{item}</Link>)}</div></div><AdminNavigation /></nav>
    <header className={`mt-6 overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} p-7 sm:p-10`}>
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0"><p className="text-sm font-bold tracking-[.2em] text-slate-500">MAST પ્રકાર</p><h1 className="mt-2 break-words font-serif text-4xl font-extrabold leading-[1.35] text-ink sm:text-6xl">{type} — {guide.title}</h1><p className="mt-2 break-words text-xl font-bold text-slate-700">{guide.subtitle}</p><blockquote className="mt-6 max-w-2xl break-words rounded-2xl bg-white/70 p-5 text-xl font-bold leading-9 text-slate-700 shadow-sm">“{guide.quote}”</blockquote><div className="mt-5 flex flex-wrap gap-2">{guide.keywords.map((tag) => <span key={tag} className="rounded-full bg-white/80 px-3 py-1.5 font-bold text-slate-700">{tag}</span>)}</div></div><img src={`/images/mast-types/${type}.png`} alt={`${guide.title} character`} className="mx-auto h-64 w-64 rounded-3xl object-cover object-top shadow-xl md:h-72 md:w-72" /></div>
    </header>
    <section className={`mt-7 overflow-hidden rounded-3xl border shadow-sm ${theme.card}`}>
      <div className="grid items-center gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0"><p className={`text-sm font-bold tracking-[.16em] ${theme.text}`}>વિડિયો માર્ગદર્શન</p><h2 className="mt-2 font-serif text-3xl font-extrabold text-ink">{video.title}</h2><p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">આ પ્રકૃતિને સમજવા માટેનું માર્ગદર્શન વિડિયોમાં જુઓ.</p><a href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer" className={`mt-5 inline-flex rounded-xl px-4 py-3 font-black text-white shadow-sm transition hover:opacity-90 ${type === "M" ? "bg-amber-700" : type === "A" ? "bg-red-700" : type === "S" ? "bg-emerald-700" : "bg-indigo-700"}`}>YouTube પર જુઓ <span className="ml-2" aria-hidden="true">↗</span></a></div>
        <a href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-2xl bg-slate-900 shadow-lg"><img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={`${guide.title} video preview`} className="aspect-video w-full object-cover transition duration-200 group-hover:scale-105" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg">▶</span></span></a>
      </div>
    </section>
    <div className="mt-7 grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="hidden lg:block"><div className="sticky top-28 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200"><p className="px-2 text-xs font-bold tracking-[.16em] text-slate-400">EXPLORE</p>{displaySections.map((section) => <a className="mt-1 block rounded-lg border-l-2 border-transparent px-2 py-2 font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 hover:text-ink" href={`#${section.id}`} key={section.id}>{section.title}</a>)}</div></aside><article className="min-w-0 space-y-6">{displaySections.map((section, index) => <section id={section.id} key={section.id} className={`scroll-mt-32 ${theme.card} rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}><div className={`flex min-w-0 items-center gap-3 ${theme.text}`}><p className="rounded-lg bg-white/80 px-2 py-1 text-sm font-extrabold tracking-[.16em]">{String(index + 1).padStart(2, "0")}</p><h2 className="min-w-0 break-words font-serif text-3xl font-extrabold leading-[1.35]">{section.title}</h2></div><GuideParagraphs paragraphs={section.paragraphs} />{section.children?.map((child) => <div key={child.id} className="mt-8 border-t border-current/15 pt-6"><h3 className={`font-serif text-2xl font-extrabold ${theme.text}`}>{child.title}</h3><GuideParagraphs paragraphs={child.paragraphs} /></div>)}</section>)}
      <section className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}><p className={`text-sm font-bold tracking-[.16em] ${theme.text}`}>સંભવિત સેવા મેચ</p><h2 className="mt-1 text-2xl font-black text-ink">{type} માટે સંભવિત સેવાઓ</h2><p className="mt-3 max-w-5xl leading-7 text-slate-600">આ માત્ર માર્ગદર્શક મેળ છે; વ્યક્તિની આવડત, તૈયારી અને પૂ. સંતનો નિર્ણય વધુ મહત્વનો છે.</p><div className="mt-5 flex flex-wrap gap-2">{serviceTags.map((service) => <span key={service.id} className="max-w-full rounded-xl bg-white/75 px-3 py-2 font-bold text-slate-700 break-words">{serviceDisplayLabel(service)}</span>)}</div></section>
      <section className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}><p className={`text-sm font-bold tracking-[.16em] ${theme.text}`}>અંતમાં યાદ રાખવું</p><div className="mt-3 max-w-5xl space-y-5 text-xl font-bold leading-9 text-ink">{guide.closing.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
    </article></div>
  </section></main>;
}

function GuideParagraphs({ paragraphs }: { paragraphs: string[] }) {
  const rendered: ReactNode[] = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index];
    const point = paragraph.match(/^[૦-૯]+\.\s+(.+)$/);
    if (point && paragraphs[index + 1]) {
      rendered.push(<p className="break-words" key={paragraph}><span className="font-extrabold text-slate-900">• {point[1]} — </span>{paragraphs[index + 1]}</p>);
      index += 1;
    } else {
      rendered.push(<p className="break-words" key={paragraph}>{paragraph}</p>);
    }
  }
  return <div className="mt-5 max-w-5xl space-y-5 text-lg leading-9 text-slate-700">{rendered}</div>;
}

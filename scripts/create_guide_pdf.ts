import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  MAST_GUIDES,
  MAST_VIVEK_GUIDE,
  getVivekPointsInSequence,
  SERVICE_CATALOG,
  serviceDisplayLabel,
  type MastType
} from "../packages/core/src/index";

const outputDir = resolve(process.cwd(), "tmp", "pdfs");
const outputPath = resolve(outputDir, "mast-guide-gujarati.html");
const types: MastType[] = ["M", "A", "S", "T"];
const tones: Record<MastType, string> = {
  M: "mint", A: "amber", S: "sky", T: "violet"
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const paragraphs = (items: readonly string[]) => items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");

const typeSection = (type: MastType) => {
  const guide = MAST_GUIDES[type];
  const services = SERVICE_CATALOG.filter((service) => service.probablePrimaryType === type);
  const servicesByChannel = services.reduce<Record<string, typeof services>>((groups, service) => {
    (groups[service.channel] ??= []).push(service);
    return groups;
  }, {});
  return `
    <section class="type-section ${tones[type]}">
      <div class="type-hero">
        <div class="type-mark">${type}</div>
        <div><div class="eyebrow">MAST પ્રકાર</div><h1>${type} - ${escapeHtml(guide.title)}</h1><div class="subtitle">${escapeHtml(guide.subtitle)}</div></div>
      </div>
      <blockquote>“${escapeHtml(guide.quote)}”</blockquote>
      <div class="keywords">${guide.keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>
      ${guide.sections.map((section, index) => `<section class="content-card"><div class="section-number">${String(index + 1).padStart(2, "0")}</div><h2>${escapeHtml(section.title)}</h2><div class="prose">${paragraphs(section.paragraphs)}</div></section>`).join("")}
      <section class="service-card"><div class="eyebrow">સંભવિત સેવા-મેળ</div><h2>${type} - ${escapeHtml(guide.title)} માટે સંભવિત સેવાઓ</h2><p class="service-note">આ માત્ર માર્ગદર્શક મેળ છે; વ્યક્તિની આવડત, તૈયારી અને પૂ. સંતનો નિર્ણય વધુ મહત્વનો છે.</p>${Object.entries(servicesByChannel).map(([channel, channelServices]) => `<div class="service-group"><h3>${escapeHtml(channel)}</h3><div class="service-tags">${channelServices.map((service) => `<span>${escapeHtml(serviceDisplayLabel(service))}</span>`).join("")}</div></div>`).join("")}</section>
      <section class="closing"><div class="eyebrow">અંતમાં યાદ રાખવું</div><div class="prose">${paragraphs(guide.closing)}</div></section>
    </section>`;
};

const vivekSection = `
  <section class="vivek-section">
    <div class="vivek-hero"><div class="vivek-mark">વિ</div><div><div class="eyebrow">MAST વાંચન માટેનું માર્ગદર્શન</div><h1>${escapeHtml(MAST_VIVEK_GUIDE.title)}</h1><div class="subtitle">${escapeHtml(MAST_VIVEK_GUIDE.subtitle)}</div></div></div>
    <section class="content-card intro-card"><div class="eyebrow">વાંચતાં પહેલાં</div><div class="prose">${paragraphs(MAST_VIVEK_GUIDE.introduction)}</div></section>
    ${getVivekPointsInSequence().map((point) => `<section class="content-card vivek-card"><div class="section-number">${String(point.number).padStart(2, "0")}</div><h2>${escapeHtml(point.title)}</h2><div class="prose">${paragraphs(point.paragraphs)}</div></section>`).join("")}
    <section class="closing golden"><div class="eyebrow">છેલ્લે યાદ રાખવું</div><p>${escapeHtml(MAST_VIVEK_GUIDE.closing)}</p></section>
  </section>`;

const html = `<!doctype html>
<html lang="gu"><head><meta charset="utf-8"><title>MAST Guide - Gujarati</title><style>
@font-face { font-family: ShrutiPDF; src: url('file:///C:/Windows/Fonts/shruti.ttf'); }
@font-face { font-family: ShrutiPDF; src: url('file:///C:/Windows/Fonts/shrutib.ttf'); font-weight: 700 900; }
@page { size: A4; margin: 15mm 14mm 17mm; }
* { box-sizing: border-box; } body { margin: 0; color: #18233b; font-family: ShrutiPDF, Nirmala UI, sans-serif; font-size: 14px; line-height: 1.62; background: #fff; }
h1, h2, h3, p { margin: 0; } h1, h2, h3, .type-mark, .vivek-mark { font-weight: 800; } h1 { font-size: 30px; line-height: 1.28; } h2 { font-size: 20px; line-height: 1.4; } h3 { font-size: 15px; } p + p { margin-top: 10px; }
.cover { min-height: 235mm; padding: 34mm 13mm; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(140deg, #edf5ff, #f6f1ff 55%, #e8fbf4); page-break-after: always; }
.kicker, .eyebrow { color: #b57717; font-size: 12px; font-weight: 800; letter-spacing: 1.4px; } .cover h1 { margin-top: 12px; font-size: 41px; } .cover .lead { max-width: 490px; margin-top: 14px; color: #4d5e79; font-size: 19px; line-height: 1.6; }
.type-overview { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 30px; } .overview-card { border-radius: 14px; padding: 14px; background: rgba(255,255,255,.76); border: 1px solid #d6e1f3; } .overview-card strong { display: block; font-size: 20px; } .overview-card span { color: #5d6a80; font-size: 14px; }
.type-section, .vivek-section { page-break-before: always; } .type-hero, .vivek-hero { padding: 20px 22px; border-radius: 20px; display: flex; align-items: center; gap: 17px; page-break-inside: avoid; } .mint .type-hero { background:#def9ef; } .amber .type-hero { background:#fff1d5; } .sky .type-hero { background:#dff5fb; } .violet .type-hero { background:#ebe9ff; } .vivek-hero { background: linear-gradient(135deg, #eeeaff, #dff1ff); }
.type-mark, .vivek-mark { display: grid; place-items:center; width: 56px; height:56px; border-radius:14px; flex:none; background:#fff; color:#213758; font-size:28px; box-shadow:0 3px 10px #8794aa3d; } .vivek-mark { background:#7353d8; color:#fff; font-size:22px; }
.subtitle { margin-top: 3px; color:#53617a; font-size:16px; font-weight:700; } blockquote { margin: 15px 4px 9px; padding: 12px 16px; border-left:4px solid #7c69d6; background:#f7f7fb; border-radius:0 12px 12px 0; font-size:17px; font-weight:700; }
.keywords, .service-tags { display:flex; flex-wrap:wrap; gap:7px; } .keywords { margin:10px 0 16px; } .keywords span, .service-tags span { background:#eef2f8; color:#364762; border-radius:100px; padding:4px 10px; font-weight:700; font-size:13px; }
.content-card, .service-card, .closing { margin-top: 12px; padding: 17px 18px; border:1px solid #dce6f4; border-radius:15px; background:#fff; page-break-inside: avoid; } .content-card { position:relative; padding-left:70px; } .section-number { position:absolute; top:17px; left:17px; min-width:37px; padding:2px 6px; border-radius:8px; color:#b57717; background:#fff7e8; text-align:center; font-weight:900; }
.prose { margin-top: 10px; color:#33445f; } .service-card { background:#f8fbff; } .service-note { margin-top:5px; color:#55677f; } .service-group { margin-top:11px; } .service-group h3 { margin-bottom:4px; color:#52627c; } .closing { background:#19263d; color:#fff; border:none; } .closing .eyebrow { color:#f6d077; } .closing p { margin-top:8px; font-size:17px; font-weight:700; line-height:1.55; } .golden { background:#fff6e2; color:#23334b; border:1px solid #f0d181; }
.intro-card { padding-left:18px; } .vivek-card:nth-of-type(3n+1) { background:#f5f3ff; } .vivek-card:nth-of-type(3n+2) { background:#effaf7; } .vivek-card:nth-of-type(3n) { background:#fff9ee; }
.footer { position: fixed; bottom: -9mm; left: 0; right: 0; color:#71809a; font-size:10px; text-align:center; }
</style></head><body>
<div class="footer">MAST Guide - Gujarati</div>
<section class="cover"><div class="kicker">MAST ADMIN</div><h1>MAST માર્ગદર્શિકા</h1><p class="lead">પ્રકૃતિને સમજીએ, વ્યક્તિને બાંધીએ નહીં. પૂ. સંત અને જવાબદાર હરિભક્તો માટે MAST પરિણામને સંવાદ, વિકાસ અને યોગ્ય સેવા માટે સહાયક રીતે વાપરવાની સંપૂર્ણ માર્ગદર્શિકા.</p><div class="type-overview">${types.map((type) => `<div class="overview-card"><strong>${type} - ${escapeHtml(MAST_GUIDES[type].title)}</strong><span>${escapeHtml(MAST_GUIDES[type].subtitle)}</span><div class="keywords" style="margin:8px 0 0">${MAST_GUIDES[type].keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div></div>`).join("")}</div><div class="overview-card" style="margin-top:10px"><strong>જરૂરી વિવેક</strong><span>${escapeHtml(MAST_VIVEK_GUIDE.subtitle)}</span></div></section>
${types.map(typeSection).join("")}
${vivekSection}
</body></html>`;

async function main() {
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, html, "utf8");
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

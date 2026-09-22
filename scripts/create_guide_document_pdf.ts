import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getVivekPointsInSequence, MAST_GUIDES, MAST_VIVEK_GUIDE, SERVICE_CATALOG, serviceDisplayLabel, type MastType } from "../packages/core/src/index";

const outputDir = resolve(process.cwd(), "tmp", "pdfs");
const outputPath = resolve(outputDir, "mast-guide-document-v4.html");
const types: MastType[] = ["M", "A", "S", "T"];
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const paragraphList = (items: readonly string[]) => items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");

function servicesFor(type: MastType) {
  const groups = SERVICE_CATALOG.filter((service) => service.probablePrimaryType === type).reduce<Record<string, string[]>>((all, service) => {
    (all[service.channel] ??= []).push(serviceDisplayLabel(service));
    return all;
  }, {});
  return `<h2>સંભવિત સેવાઓ</h2><p>આ માત્ર માર્ગદર્શક મેળ છે. વ્યક્તિની આવડત, તૈયારી અને પૂ. સંતનો નિર્ણય વધુ મહત્વનો છે.</p>${Object.entries(groups).map(([channel, labels]) => `<p><strong>${escapeHtml(channel)}:</strong> ${labels.map(escapeHtml).join(" • ")}</p>`).join("")}`;
}

function typeDocument(type: MastType) {
  const guide = MAST_GUIDES[type];
  return `<section class="chapter"><h1>${type} - ${escapeHtml(guide.title)}</h1><p class="subtitle">${escapeHtml(guide.subtitle)}</p><p class="quote">“${escapeHtml(guide.quote)}”</p><p><strong>મુખ્ય શબ્દો:</strong> ${guide.keywords.map(escapeHtml).join(" | ")}</p>${guide.sections.map((section, index) => `<h2>${index + 1}. ${escapeHtml(section.title)}</h2>${paragraphList(section.paragraphs)}`).join("")}${servicesFor(type)}<h2>અંતમાં યાદ રાખવું</h2>${paragraphList(guide.closing).replaceAll("<p>", "<p><strong>").replaceAll("</p>", "</strong></p>")}</section>`;
}

const html = `<!doctype html><html lang="gu"><head><meta charset="utf-8"><title>MAST માર્ગદર્શિકા</title><style>
@font-face { font-family: ShrutiDoc; src: url('file:///C:/Windows/Fonts/shruti.ttf'); }
@font-face { font-family: ShrutiDoc; src: url('file:///C:/Windows/Fonts/shrutib.ttf'); font-weight: 700 900; }
@page { size:A4; margin:21mm 20mm 25mm; } body { font-family:'Nirmala UI', sans-serif; color:#000; font-size:14px; line-height:1.55; } h1,h2,p { margin:0; } h1 { font-size:25px; line-height:1.32; margin:0 0 5px; font-weight:800; break-after:avoid; page-break-after:avoid; } h2 { font-size:17px; line-height:1.42; margin:18px 0 5px; font-weight:800; break-after:avoid; page-break-after:avoid; } p { margin:0 0 8px; break-inside:avoid; page-break-inside:avoid; } p + p { margin-top:7px; } .cover { height:251mm; overflow:hidden; display:flex; flex-direction:column; justify-content:center; text-align:center; } .cover h1 { font-size:32px; } .cover .subtitle { margin:9px auto 18px; font-size:17px; } .cover .summary { margin:0 auto; max-width:470px; text-align:left; } .cover h2 { text-align:left; } .toc { margin:4px auto 0; max-width:470px; text-align:left; } .toc p { margin-bottom:3px; } .chapter { margin-top:22px; } .cover + .chapter { margin-top:0; } .subtitle { font-weight:700; font-size:16px; } .quote { margin:12px 0; padding-left:14px; border-left:2px solid #000; font-weight:700; break-inside:avoid; page-break-inside:avoid; } .note { font-weight:700; } strong { font-weight:800; }
</style></head><body>
<section class="cover"><h1>MAST માર્ગદર્શિકા</h1><p class="subtitle">પ્રકૃતિને સમજીએ, વ્યક્તિને બાંધીએ નહીં</p><p class="summary">આ દસ્તાવેજમાં M, A, S અને T ચારેય MAST પ્રકૃતિનું સંપૂર્ણ માર્ગદર્શન, તેમના મુખ્ય શબ્દો, quotes, ઓળખ, શક્તિઓ, ધ્યાન રાખવાની બાબતો, પૂ. સંત માટે માર્ગદર્શન, વિકાસ અને સેવા, દબાણ સમયે વર્તન, સંભવિત સેવાઓ તથા જરૂરી વિવેકના મુદ્દાઓ સામેલ છે.</p><h2>વિષયસૂચિ</h2><div class="toc">${types.map((type) => `<p>${type} - ${escapeHtml(MAST_GUIDES[type].title)}: ${escapeHtml(MAST_GUIDES[type].subtitle)}</p>`).join("")}<p>જરૂરી વિવેક</p></div></section>
${types.map(typeDocument).join("")}
<section class="chapter"><h1>${escapeHtml(MAST_VIVEK_GUIDE.title)}</h1><p class="subtitle">${escapeHtml(MAST_VIVEK_GUIDE.subtitle)}</p><h2>વાંચતાં પહેલાં</h2>${paragraphList(MAST_VIVEK_GUIDE.introduction)}${getVivekPointsInSequence().map((point) => `<h2>${point.number}. ${escapeHtml(point.title)}</h2>${paragraphList(point.paragraphs)}`).join("")}<h2>છેલ્લે યાદ રાખવું</h2><p><strong>${escapeHtml(MAST_VIVEK_GUIDE.closing)}</strong></p></section>
</body></html>`;

async function main() { await mkdir(outputDir, { recursive: true }); await writeFile(outputPath, html, "utf8"); console.log(outputPath); }
main().catch((error) => { console.error(error); process.exitCode = 1; });

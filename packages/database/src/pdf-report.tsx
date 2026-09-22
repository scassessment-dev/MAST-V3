import React from "react";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToStream } from "@react-pdf/renderer";
import { MAST_LABELS, MAST_TYPE_THEME, type MastType } from "@mast/core";

type PdfReportResponse = {
  id: string;
  participantName: string;
  age: number;
  submittedAt: Date;
  scoreM: number;
  scoreA: number;
  scoreS: number;
  scoreT: number;
  primaryType: string;
  secondaryType: string;
  sequence: string;
  center: { name: string; zone: { name: string } };
};

const gujaratiFontCandidates = [
  process.env.GUJARATI_FONT_PATH,
  join(process.cwd(), "../../packages/core/fonts/NotoSansGujarati-Regular.ttf"),
  join(process.cwd(), "fonts", "NotoSansGujarati-Regular.ttf"),
  join(process.cwd(), "public", "fonts", "NotoSansGujarati-Regular.ttf"),
  "C:/Windows/Fonts/shruti.ttf"
].filter(Boolean) as string[];

const gujaratiBoldFontCandidates = [
  process.env.GUJARATI_BOLD_FONT_PATH,
  join(process.cwd(), "../../packages/core/fonts/NotoSansGujarati-Bold.ttf"),
  join(process.cwd(), "fonts", "NotoSansGujarati-Bold.ttf"),
  join(process.cwd(), "public", "fonts", "NotoSansGujarati-Bold.ttf"),
  "C:/Windows/Fonts/shrutib.ttf"
].filter(Boolean) as string[];

function firstExisting(paths: string[]): string | undefined {
  return paths.find((path) => existsSync(path));
}

const gujaratiFontPath = firstExisting(gujaratiFontCandidates);
const gujaratiBoldFontPath = firstExisting(gujaratiBoldFontCandidates);
const reportFontFamily = gujaratiFontPath ? "GujaratiReport" : "Helvetica";

if (gujaratiFontPath) {
  Font.register({
    family: "GujaratiReport",
    fonts: [
      { src: gujaratiFontPath, fontWeight: 400 },
      { src: gujaratiBoldFontPath ?? gujaratiFontPath, fontWeight: 700 }
    ]
  });
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#172033", fontFamily: reportFontFamily },
  title: { fontSize: 22, marginBottom: 14, fontWeight: 700 },
  muted: { color: "#5b6678", marginBottom: 4 },
  section: { marginTop: 18, padding: 14, border: "1 solid #d9e4f2", borderRadius: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", borderBottom: "1 solid #edf2f7", paddingVertical: 7 },
  label: { fontWeight: 700 },
  pill: { marginTop: 8, padding: 8, backgroundColor: "#eef6ff", borderRadius: 6 }
});

function ReportDocument({ response }: { response: PdfReportResponse }) {
  const scores = [
    ["M", response.scoreM],
    ["A", response.scoreA],
    ["S", response.scoreS],
    ["T", response.scoreT]
  ] as Array<[MastType, number]>;
  const primary = response.primaryType as MastType;
  const secondary = response.secondaryType as MastType;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>MAST Assessment Report</Text>
        <Text style={styles.muted}>નામ: {response.participantName}</Text>
        <Text style={styles.muted}>ઉંમર: {response.age}</Text>
        <Text style={styles.muted}>ઝોન: {response.center.zone.name}</Text>
        <Text style={styles.muted}>સેન્ટર: {response.center.name}</Text>
        <Text style={styles.muted}>તારીખ: {response.submittedAt.toLocaleString("en-IN")}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>પરિણામ સારાંશ</Text>
          <Text style={[styles.pill, { backgroundColor: MAST_TYPE_THEME[primary].softHex, color: MAST_TYPE_THEME[primary].accentHex }]}>મુખ્ય પ્રકાર: {response.primaryType} - {MAST_LABELS[primary].label}</Text>
          <Text style={[styles.pill, { backgroundColor: MAST_TYPE_THEME[secondary].softHex, color: MAST_TYPE_THEME[secondary].accentHex }]}>બીજો પ્રકાર: {response.secondaryType} - {MAST_LABELS[secondary].label}</Text>
          <Text style={styles.pill}>ક્રમ: {response.sequence}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>સ્કોર</Text>
          {scores.map(([type, score]) => (
            <View key={type} style={[styles.row, { backgroundColor: MAST_TYPE_THEME[type].softHex }]}>
              <Text>{type} - {MAST_LABELS[type].label}</Text>
              <Text>{score}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function pdfReport(response: PdfReportResponse) {
  return renderToStream(<ReportDocument response={response} />);
}

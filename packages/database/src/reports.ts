import { getServiceById, getServiceMatchStatus, MAST_LABELS, MAST_TYPE_THEME, NO_SERVICE_ID, serviceDisplayLabel, serviceMatchLabel, type MastType } from "@mast/core";

type ReportResponse = {
  participantName: string;
  age: number;
  gender: string;
  submittedAt: Date;
  scoreM: number;
  scoreA: number;
  scoreS: number;
  scoreT: number;
  primaryType: string;
  secondaryType: string;
  sequence: string;
  valid: string | null;
  servicePriorities?: string[];
  answers: unknown;
  center: { name: string; zone: { name: string } };
};

export function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function responseToCsvRow(response: ReportResponse): string[] {
  const serviceCells = [0, 1, 2].flatMap((index) => serviceCsvFields(response, response.servicePriorities?.[index]));

  return [
    response.submittedAt.toISOString(),
    response.participantName,
    response.age,
    response.gender,
    response.center.zone.name,
    response.center.name,
    response.scoreM,
    response.scoreA,
    response.scoreS,
    response.scoreT,
    response.primaryType,
    response.secondaryType,
    response.sequence,
    response.valid ?? "",
    ...serviceCells
  ].map(String);
}

export function csvHeaders(): string[] {
  return [
    "Submitted date/time",
    "Participant name",
    "Age",
    "Gender",
    "Zone",
    "Center",
    "Score M",
    "Score A",
    "Score S",
    "Score T",
    "Primary type",
    "Secondary type",
    "Sequence",
    "Valid",
    "Current service 1",
    "Service 1 match",
    "Current service 2",
    "Service 2 match",
    "Current service 3",
    "Service 3 match"
  ];
}

function serviceCsvFields(response: ReportResponse, serviceId?: string): [string, string] {
  if (!serviceId) return ["", ""];
  if (serviceId === NO_SERVICE_ID) return ["હાલ કોઈ સેવા નથી", "—"];
  const service = getServiceById(serviceId);
  const status = getServiceMatchStatus({
    serviceId,
    primaryType: response.primaryType as MastType,
    valid: response.valid as "Valid" | "Invalid" | null
  });
  return [service ? serviceDisplayLabel(service) : serviceId, serviceMatchLabel(status)];
}

export function makeCsv(responses: ReportResponse[]): string {
  return [csvHeaders(), ...responses.map(responseToCsvRow)].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function htmlReport(response: ReportResponse): string {
  const scores = [
    ["M", response.scoreM],
    ["A", response.scoreA],
    ["S", response.scoreS],
    ["T", response.scoreT]
  ] as Array<[MastType, number]>;

  const scoreRows = scores
    .map(([type, score]) => `<tr style="background:${MAST_TYPE_THEME[type].softHex}"><td>${type} - ${MAST_LABELS[type].label}</td><td>${score}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="gu">
<head>
  <meta charset="utf-8" />
  <title>MAST Report</title>
  <style>
    body{font-family:Arial,Noto Sans Gujarati,sans-serif;color:#172033;margin:32px;background:#fbfdff}
    .card{border:1px solid #d9e4f2;border-radius:12px;padding:24px;background:white}
    h1{font-size:26px;margin:0 0 16px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    td,th{border:1px solid #dbe5f2;padding:10px;text-align:left}
    .pill{display:inline-block;padding:8px 12px;border-radius:999px;background:#eef6ff;margin-right:8px}
  </style>
</head>
<body>
  <div class="card">
    <h1>સંસ્થાકીય કાર્યશૈલી મૂલ્યાંકન</h1>
    <p><strong>નામ:</strong> ${response.participantName}</p>
    <p><strong>ઉંમર:</strong> ${response.age}</p>
    <p><strong>ઝોન:</strong> ${response.center.zone.name}</p>
    <p><strong>સેન્ટર:</strong> ${response.center.name}</p>
    <p><strong>તારીખ:</strong> ${response.submittedAt.toLocaleString("en-IN")}</p>
    <p><span class="pill" style="background:${MAST_TYPE_THEME[response.primaryType as MastType].softHex};color:${MAST_TYPE_THEME[response.primaryType as MastType].accentHex}">Primary: ${response.primaryType}</span><span class="pill" style="background:${MAST_TYPE_THEME[response.secondaryType as MastType].softHex};color:${MAST_TYPE_THEME[response.secondaryType as MastType].accentHex}">Secondary: ${response.secondaryType}</span><span class="pill">Sequence: ${response.sequence}</span></p>
    <table><thead><tr><th>Type</th><th>Score</th></tr></thead><tbody>${scoreRows}</tbody></table>
  </div>
</body>
</html>`;
}

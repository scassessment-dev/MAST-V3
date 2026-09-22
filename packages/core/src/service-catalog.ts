import type { MastType } from "./test-content";

export type ServiceChannel =
  | "બાળ"
  | "કિશોર"
  | "યુવક"
  | "સંપર્ક"
  | "સેવા"
  | "વહીવટ"
  | "મંદિર";

export const SERVICE_CHANNEL_ORDER: readonly ServiceChannel[] = [
  "બાળ",
  "કિશોર",
  "યુવક",
  "સંપર્ક",
  "સેવા",
  "વહીવટ",
  "મંદિર"
] as const;

export type ServiceCatalogItem = {
  id: string;
  shortCode: string;
  name: string;
  channel: ServiceChannel;
  probablePrimaryType: MastType;
};

/**
 * Approved MAST service suggestions. This is advisory information only; a
 * person's preparation and the decision of પૂ. સંત always take precedence.
 */
export const SERVICE_CATALOG: readonly ServiceCatalogItem[] = [
  { id: "bps", shortCode: "BPS", name: "બાળ પ્રવૃત્તિ સંયોજક", channel: "બાળ", probablePrimaryType: "A" },
  { id: "bpn", shortCode: "BPN", name: "બાળ પ્રવૃત્તિ નિર્દેશક", channel: "બાળ", probablePrimaryType: "A" },
  { id: "bms", shortCode: "BMS", name: "બાળ મંડળ સંચાલક", channel: "બાળ", probablePrimaryType: "S" },
  { id: "bsk", shortCode: "BSK", name: "બાળ સભા કાર્યકર", channel: "બાળ", probablePrimaryType: "S" },
  { id: "abs-s", shortCode: "ABS S", name: "ABS સંચાલક", channel: "બાળ", probablePrimaryType: "S" },
  { id: "kms", shortCode: "KMS", name: "કિશોર મુખ્ય સંચાલક", channel: "કિશોર", probablePrimaryType: "A" },
  { id: "ymn", shortCode: "YMN", name: "યુવક મંડળ નિરીક્ષક", channel: "યુવક", probablePrimaryType: "A" },
  { id: "yms", shortCode: "YMS", name: "યુવક મુખ્ય સંચાલક", channel: "યુવક", probablePrimaryType: "A" },
  { id: "ys", shortCode: "YS", name: "યુવક સંચાલક", channel: "યુવક", probablePrimaryType: "A" },
  { id: "sms", shortCode: "SMS", name: "સંપર્ક મુખ્ય સંચાલક (યુવક મંડળ)", channel: "સંપર્ક", probablePrimaryType: "M" },
  { id: "ss", shortCode: "SS", name: "સંપર્ક સંચાલક", channel: "સંપર્ક", probablePrimaryType: "M" },
  { id: "sds", shortCode: "SDS", name: "સેવા ધર્માદા સંચાલક", channel: "સેવા", probablePrimaryType: "S" },
  { id: "apn", shortCode: "APN", name: "આદર્શ પ્રોજેક્ટ નિરીક્ષક", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "apms", shortCode: "APMS", name: "આદર્શ પ્રોજેક્ટ મુખ્ય સંચાલક", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "group-leader", shortCode: "ગ્રુપ લીડર", name: "ગ્રુપ લીડર", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "computer-it-operator", shortCode: "IT", name: "કમ્પ્યુટર/IT ઓપરેટર", channel: "વહીવટ", probablePrimaryType: "T" },
  { id: "kothari", shortCode: "કોઠારી", name: "કોઠારી", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "sah-kothari", shortCode: "સહ કોઠારી", name: "સહ કોઠારી", channel: "વહીવટ", probablePrimaryType: "T" },
  { id: "accountant", shortCode: "એકાઉન્ટન્ટ", name: "એકાઉન્ટન્ટ", channel: "વહીવટ", probablePrimaryType: "T" },
  { id: "center-auditor", shortCode: "સેન્ટર ઓડીટર", name: "સેન્ટર ઓડીટર", channel: "વહીવટ", probablePrimaryType: "T" },
  { id: "zonal-sps", shortCode: "ઝોનલ SPS/Sub-Zonal SPS", name: "ઝોનલ SPS / સબ ઝોનલ SPS", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "zonal-administrator", shortCode: "ઝોનલ વહીવટદાર", name: "ઝોનલ વહીવટદાર", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "zonal-accountant", shortCode: "ઝોનલ એકાઉન્ટન્ટ", name: "ઝોનલ એકાઉન્ટન્ટ", channel: "વહીવટ", probablePrimaryType: "T" },
  { id: "event-coordinator", shortCode: "ઇવેન્ટ સંચાલક", name: "ઇવેન્ટ સંચાલક", channel: "વહીવટ", probablePrimaryType: "A" },
  { id: "bmn", shortCode: "BMN", name: "બાળ મંડળ નિરીક્ષક", channel: "બાળ", probablePrimaryType: "S" },
  { id: "abs-leader", shortCode: "ABS Leader", name: "ABS Leader", channel: "બાળ", probablePrimaryType: "A" },
  { id: "abs-ms", shortCode: "ABS MS", name: "ABS મુખ્ય સંચાલક", channel: "બાળ", probablePrimaryType: "A" },
  { id: "abs-primary", shortCode: "ABS Primary", name: "ABS Primary સંચાલક", channel: "બાળ", probablePrimaryType: "S" },
  { id: "abs-advance", shortCode: "ABS Advance", name: "ABS Advance સંચાલક", channel: "બાળ", probablePrimaryType: "S" },
  { id: "ks", shortCode: "KS", name: "કિશોર સંચાલક", channel: "કિશોર", probablePrimaryType: "S" },
  { id: "ksl", shortCode: "KSL", name: "કિશોર સભા લીડર", channel: "કિશોર", probablePrimaryType: "M" },
  { id: "ysl", shortCode: "YSL", name: "યુવક સભા લીડર", channel: "યુવક", probablePrimaryType: "M" },
  { id: "ams", shortCode: "AMS", name: "એરિયા મંડળ સંચાલક", channel: "યુવક", probablePrimaryType: "M" },
  { id: "gms", shortCode: "GMS", name: "ગ્રામ્ય મંડળ સંચાલક", channel: "યુવક", probablePrimaryType: "M" },
  { id: "sk", shortCode: "SK", name: "સંપર્ક કાર્યકર", channel: "સંપર્ક", probablePrimaryType: "M" },
  { id: "sdk", shortCode: "SDK", name: "સેવા ધર્માદા કાર્યકર", channel: "સેવા", probablePrimaryType: "S" },
  { id: "pre-mumukshu", shortCode: "Pre-Mumukshu", name: "પ્રિ-મુમુક્ષુ મુખ્ય સંચાલક", channel: "યુવક", probablePrimaryType: "A" },
  { id: "ayp", shortCode: "AYP", name: "AYP મુખ્ય સંચાલક", channel: "યુવક", probablePrimaryType: "A" },
  { id: "dss", shortCode: "DSS", name: "DSS મુખ્ય સંચાલક", channel: "યુવક", probablePrimaryType: "A" },
  { id: "kitchen-manager", shortCode: "રસોડા વ્યવસ્થાપક", name: "રસોડા વ્યવસ્થાપક", channel: "મંદિર", probablePrimaryType: "T" },
  { id: "kitchen-member", shortCode: "રસોડા સભ્ય", name: "રસોડા સભ્ય", channel: "મંદિર", probablePrimaryType: "S" },
  { id: "facility-manager", shortCode: "સુવિધા વ્યવસ્થાપક", name: "સુવિધા વ્યવસ્થાપક", channel: "મંદિર", probablePrimaryType: "T" },
  { id: "service-manager", shortCode: "સેવા વ્યવસ્થાપક", name: "સેવા વ્યવસ્થાપક", channel: "સેવા", probablePrimaryType: "S" },
  { id: "temple-manager", shortCode: "મંદિર વ્યવસ્થાપક", name: "મંદિર વ્યવસ્થાપક", channel: "મંદિર", probablePrimaryType: "T" },
  { id: "bs", shortCode: "BS", name: "બાળ સંચાલક", channel: "બાળ", probablePrimaryType: "S" },
  { id: "bk", shortCode: "BK", name: "બાળ કાર્યકર", channel: "બાળ", probablePrimaryType: "S" },
  { id: "kk", shortCode: "KK", name: "કિશોર કાર્યકર", channel: "કિશોર", probablePrimaryType: "S" },
  { id: "yk", shortCode: "YK", name: "યુવા કાર્યકર", channel: "યુવક", probablePrimaryType: "S" },
  { id: "seva-karyakar", shortCode: "સેવા કાર્યકર", name: "સેવા કાર્યકર", channel: "સેવા", probablePrimaryType: "S" }
] as const;

export const NO_SERVICE_ID = "no-service";

export function getServiceById(id: string | null | undefined): ServiceCatalogItem | undefined {
  return SERVICE_CATALOG.find((service) => service.id === id);
}

export function getServicesByChannel(channel: ServiceChannel): readonly ServiceCatalogItem[] {
  return SERVICE_CATALOG.filter((service) => service.channel === channel);
}

/**
 * Shows the code and full name only when each adds useful information. This
 * avoids labels such as "ABS Primary — ABS Primary સંચાલક".
 */
export function serviceDisplayLabel(service: Pick<ServiceCatalogItem, "shortCode" | "name">): string {
  const shortCode = service.shortCode.trim();
  const name = service.name.trim();
  const isSpelledOutName = /[a-z]/i.test(shortCode) && shortCode.includes("-");
  if (shortCode === name || name.startsWith(`${shortCode} `) || isSpelledOutName) return name;
  return `${shortCode} — ${name}`;
}

export function validateServicePriorities(values: string[]): { valid: boolean; message?: string } {
  if (values.length < 1 || values.length > 3 || !values[0]) return { valid: false, message: "હાલની સેવા 1 પસંદ કરવી જરૂરી છે." };
  if (values[0] === NO_SERVICE_ID) return values.length === 1
    ? { valid: true }
    : { valid: false, message: "‘હાલ કોઈ સેવા નથી’ સાથે બીજી પ્રાથમિકતા પસંદ કરી શકાતી નથી." };
  if (values.some((id) => !getServiceById(id))) return { valid: false, message: "પસંદ કરેલી સેવા માન્ય નથી." };
  if (new Set(values).size !== values.length) return { valid: false, message: "એક જ સેવા ફરીથી પસંદ કરી શકાતી નથી." };
  return { valid: true };
}

export type ServiceMatchStatus = "matched" | "not_matched" | "pending" | "not_applicable" | "unavailable";

export function getServiceMatchStatus(input: {
  serviceId: string | null | undefined;
  primaryType: MastType;
  valid: "Valid" | "Invalid" | null;
}): ServiceMatchStatus {
  if (!input.serviceId) return "unavailable";
  if (input.serviceId === NO_SERVICE_ID) return "not_applicable";
  if (input.valid !== "Valid") return "pending";
  return getServiceById(input.serviceId)?.probablePrimaryType === input.primaryType ? "matched" : "not_matched";
}

export function serviceMatchLabel(status: ServiceMatchStatus): string {
  return {
    matched: "Matched",
    not_matched: "Not Matched",
    pending: "Pending",
    not_applicable: "લાગુ નથી",
    unavailable: "માહિતી ઉપલબ્ધ નથી"
  }[status];
}

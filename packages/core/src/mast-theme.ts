import type { MastType } from "./test-content";

export type MastTypeTheme = {
  accentHex: string;
  softHex: string;
  badge: string;
  card: string;
  gradient: string;
  text: string;
};

/**
 * One visual language for MAST types across dashboards, guides and reports.
 * Semantic status colours (validity and match state) intentionally live apart.
 */
export const MAST_TYPE_THEME: Record<MastType, MastTypeTheme> = {
  M: {
    accentHex: "#b45309",
    softHex: "#fef3c7",
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200 bg-amber-50",
    gradient: "from-amber-50 to-yellow-100",
    text: "text-amber-800"
  },
  A: {
    accentHex: "#b91c1c",
    softHex: "#fee2e2",
    badge: "bg-red-100 text-red-800",
    card: "border-red-200 bg-red-50",
    gradient: "from-red-50 to-rose-100",
    text: "text-red-800"
  },
  S: {
    accentHex: "#047857",
    softHex: "#d1fae5",
    badge: "bg-emerald-100 text-emerald-800",
    card: "border-emerald-200 bg-emerald-50",
    gradient: "from-emerald-50 to-green-100",
    text: "text-emerald-800"
  },
  T: {
    accentHex: "#4338ca",
    softHex: "#e0e7ff",
    badge: "bg-indigo-100 text-indigo-800",
    card: "border-indigo-200 bg-indigo-50",
    gradient: "from-indigo-50 to-blue-100",
    text: "text-indigo-800"
  }
};

/**
 * Outcome colours deliberately live outside the four MAST type colours.
 * Invalid is a re-test state, not a destructive error; unmatched is neutral.
 */
export const MAST_STATUS_THEME = {
  valid: {
    badge: "bg-teal-100 text-teal-800",
    card: "border-teal-200 bg-teal-50",
    icon: "bg-teal-100 text-teal-700",
    text: "text-teal-800",
    action: "bg-teal-700 text-white hover:bg-teal-800"
  },
  invalid: {
    badge: "bg-violet-100 text-violet-800",
    card: "border-violet-200 bg-violet-50",
    icon: "bg-violet-100 text-violet-700",
    text: "text-violet-800",
    action: "bg-violet-700 text-white hover:bg-violet-800"
  },
  matched: {
    badge: "bg-sky-100 text-sky-800",
    card: "border-sky-300 bg-sky-50",
    selected: "border-sky-300 bg-sky-50 text-sky-900 ring-2 ring-sky-200"
  },
  notMatched: {
    badge: "bg-slate-200 text-slate-700",
    card: "border-slate-300 bg-slate-50",
    selected: "border-slate-300 bg-slate-100 text-slate-800 ring-2 ring-slate-200"
  },
  pending: {
    badge: "bg-slate-100 text-slate-500",
    card: "border-slate-200 bg-slate-50"
  }
} as const;

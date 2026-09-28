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
    badge: "bg-cyan-200 text-cyan-950 ring-1 ring-cyan-300",
    card: "border-cyan-300 bg-cyan-50",
    icon: "bg-cyan-100 text-cyan-700",
    text: "text-cyan-800",
    action: "bg-cyan-700 text-white hover:bg-cyan-800"
  },
  invalid: {
    badge: "bg-rose-200 text-rose-950 ring-1 ring-rose-300",
    card: "border-rose-300 bg-rose-50",
    icon: "bg-rose-100 text-rose-700",
    text: "text-rose-800",
    action: "bg-rose-700 text-white hover:bg-rose-800"
  },
  matched: {
    badge: "bg-cyan-200 text-cyan-950 ring-1 ring-cyan-300",
    card: "border-cyan-300 bg-cyan-50",
    selected: "border-cyan-300 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-200"
  },
  notMatched: {
    badge: "bg-rose-200 text-rose-950 ring-1 ring-rose-300",
    card: "border-rose-300 bg-rose-50",
    selected: "border-rose-300 bg-rose-50 text-rose-950 ring-2 ring-rose-200"
  },
  pending: {
    badge: "bg-slate-100 text-slate-500",
    card: "border-slate-200 bg-slate-50"
  }
} as const;

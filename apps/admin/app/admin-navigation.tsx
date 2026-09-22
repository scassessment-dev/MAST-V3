"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./logout-button";

const guideLinks = [
  { href: "/guide/M", label: "M — મિલનસાર", accent: "bg-amber-400" },
  { href: "/guide/A", label: "A — આદેશક", accent: "bg-red-500" },
  { href: "/guide/S", label: "S — સહયોગી", accent: "bg-emerald-500" },
  { href: "/guide/T", label: "T — તર્કબદ્ધ", accent: "bg-indigo-500" },
  { href: "/guide/vivek", label: "જરૂરી વિવેક", accent: "bg-slate-500" }
];

export default function AdminNavigation() {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const dashboardActive = pathname === "/";
  const guideActive = pathname.startsWith("/guide");

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/75 p-1.5 shadow-sm backdrop-blur">
      <Link
        href="/"
        className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${dashboardActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}
      >
        Dashboard
      </Link>

      <div
        className="relative"
        onMouseEnter={() => setGuideOpen(true)}
        onMouseLeave={() => setGuideOpen(false)}
      >
        <button
          type="button"
          aria-expanded={guideOpen}
          aria-haspopup="menu"
          onClick={() => setGuideOpen((open) => !open)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${guideActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"}`}
        >
          Guide <span aria-hidden="true" className={`text-xs transition-transform ${guideOpen ? "rotate-180" : ""}`}>⌄</span>
        </button>

        {guideOpen ? (
          <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/40">
            <Link href="/guide" role="menuitem" onClick={() => setGuideOpen(false)} className="mb-1 block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Guide overview
            </Link>
            <div className="mx-2 border-t border-slate-100" />
            {guideLinks.map((item) => (
              <Link key={item.href} href={item.href} role="menuitem" onClick={() => setGuideOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                <span className={`h-2.5 w-2.5 rounded-full ${item.accent}`} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <LogoutButton />
    </nav>
  );
}

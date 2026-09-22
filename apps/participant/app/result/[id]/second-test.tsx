"use client";

import { useState } from "react";
import Link from "next/link";
import {
  NO_SERVICE_ID,
  MAST_STATUS_THEME,
  MAST_TYPE_THEME,
  SERVICE_CHANNEL_ORDER,
  SERVICE_CATALOG,
  serviceDisplayLabel,
  SECOND_TEST_INSTRUCTION,
  SECOND_TEST_INVALID_MESSAGE,
  SECOND_TEST_STATEMENTS,
  SECOND_TEST_COUNT,
  type MastType
} from "@mast/core";
import { MAST_LABELS } from "@mast/core";

type Stage = "instruction" | "questions" | "services" | "submitting" | "valid" | "invalid";

export default function SecondTest({
  responseId,
  primaryType,
  secondaryType,
  initialValid
}: {
  responseId: string;
  primaryType: MastType;
  secondaryType: MastType;
  initialValid?: "Valid" | "Invalid" | null;
}) {
  const statements = SECOND_TEST_STATEMENTS[primaryType];
  const [stage, setStage] = useState<Stage>(
    initialValid === "Valid" ? "valid" : initialValid === "Invalid" ? "invalid" : "instruction"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [servicePriorities, setServicePriorities] = useState<string[]>([""]);
  const [error, setError] = useState("");

  const typeLabel = `${primaryType} — ${MAST_LABELS[primaryType].label}`;

  function handleAnswer(answer: boolean) {
    if (stage !== "questions") return;
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (newAnswers.length < SECOND_TEST_COUNT) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStage("services");
    }
  }

  function updatePriority(index: number, value: string) {
    setError("");
    if (index === 0 && value === NO_SERVICE_ID) {
      setServicePriorities([NO_SERVICE_ID]);
      return;
    }
    setServicePriorities((current) => {
      const next = [...current];
      next[index] = value;
      while (next.length > 1 && !next[next.length - 1]) next.pop();
      return next;
    });
  }

  async function submitServices() {
    const selected = servicePriorities.filter(Boolean);
    if (!selected[0]) {
      setError("હાલની સેવા 1 પસંદ કરવી જરૂરી છે.");
      return;
    }
    if (new Set(selected).size !== selected.length) {
      setError("એક જ સેવા ફરીથી પસંદ કરી શકાતી નથી.");
      return;
    }
    setStage("submitting");
    try {
      const res = await fetch(`/api/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secondTestAnswers: answers, servicePriorities: selected })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Save failed");
      setStage(payload.response.valid === "Valid" ? "valid" : "invalid");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ડેટા સેવ કરવામાં સમસ્યા આવી. ફરી પ્રયાસ કરો.");
      setStage("services");
    }
  }

  // ── Instruction screen ──────────────────────────────────────────────────────
  if (stage === "instruction") {
    return (
      <section className="mt-8 rounded-2xl border border-blue-100 bg-white/80 p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Second Test</p>
        <h2 className="mt-2 text-2xl font-black text-ink">
          Your Primary Type: <span className={MAST_TYPE_THEME[primaryType].text}>{typeLabel}</span>
        </h2>

        <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-5">
          <p className="text-lg sm:text-xl font-bold leading-9 text-slate-900">{SECOND_TEST_INSTRUCTION}</p>
        </div>

        <button
          type="button"
          onClick={() => setStage("questions")}
          className="mt-6 w-full rounded-xl bg-ink px-6 py-5 text-xl sm:text-2xl font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
        >
          શરૂ કરો →
        </button>
      </section>
    );
  }

  // ── Submitting screen ───────────────────────────────────────────────────────
  if (stage === "submitting") {
    return (
      <section className="mt-8 rounded-2xl border border-blue-100 bg-white/80 p-6 sm:p-8 text-center">
        <div className="flex justify-center">
          <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-bold text-slate-700">સેવ થઈ રહ્યું છે...</p>
      </section>
    );
  }

  // ── Valid screen ────────────────────────────────────────────────────────────
  if (stage === "valid") {
    return (
      <section className={`mt-8 rounded-2xl border p-6 sm:p-8 text-center ${MAST_STATUS_THEME.valid.card}`}>
        <div className="flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${MAST_STATUS_THEME.valid.icon}`}>
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className={`mt-4 text-3xl font-black ${MAST_STATUS_THEME.valid.text}`}>ટેસ્ટ સંપૂર્ણ!</h2>
        <p className={`mt-2 text-lg sm:text-xl font-bold ${MAST_STATUS_THEME.valid.text}`}>
          તમારી Primary Type <strong>{typeLabel}</strong> Confirmed છે.
        </p>
        <p className={`mt-2 text-base font-semibold ${MAST_STATUS_THEME.valid.text}`}>
          Secondary Type: {secondaryType} — {MAST_LABELS[secondaryType].label}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-ink px-8 py-4 text-xl font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
        >
          નવી ટેસ્ટ ભરો →
        </Link>
      </section>
    );
  }

  // ── Invalid screen ──────────────────────────────────────────────────────────
  if (stage === "invalid") {
    return (
      <section className={`mt-8 rounded-2xl border p-6 sm:p-8 text-center ${MAST_STATUS_THEME.invalid.card}`}>
        <div className="flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${MAST_STATUS_THEME.invalid.icon}`}>
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>
        <p className={`mt-4 text-lg sm:text-xl font-bold leading-9 ${MAST_STATUS_THEME.invalid.text}`}>
          {SECOND_TEST_INVALID_MESSAGE}
        </p>
        <Link
          href="/"
          className={`mt-6 inline-block rounded-xl px-8 py-4 text-xl font-bold shadow-lg shadow-violet-200 transition ${MAST_STATUS_THEME.invalid.action}`}
        >
          નવી ટેસ્ટ આપો
        </Link>
      </section>
    );
  }

  if (stage === "services") {
    const noService = servicePriorities[0] === NO_SERVICE_ID;
    const selected = new Set(servicePriorities.filter(Boolean));
    const slots = [0, 1, 2];
    return (
      <section className="mt-8 rounded-2xl border border-blue-100 bg-white/80 p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">હાલની સેવાઓ</p>
        <h2 className="mt-2 text-2xl font-black text-ink">અત્યારે તમે સેન્ટરમાં કઈ સેવા કરો છો?</h2>
        <p className="mt-2 leading-7 text-slate-600">
          હાલની સેવા 1 ફરજિયાત છે. હાલની સેવા 2 અને 3 વૈકલ્પિક છે. આ માહિતી માત્ર સંભવિત સેવા મેચ દર્શાવે છે; અંતિમ નિર્ણય પૂ. સંતનો રહેશે.
        </p>
        <div className="mt-6 space-y-4">
          {slots.map((index) => {
            const value = servicePriorities[index] ?? "";
            const disabled = (index > 0 && noService) || (index === 1 && !servicePriorities[0]) || (index === 2 && !servicePriorities[1]);
            return (
              <label key={index} className={`block rounded-xl border p-4 ${disabled ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-200 bg-white"}`}>
                <span className="mb-2 block font-bold text-ink">
                  હાલની સેવા {index + 1}{index === 0 ? " *" : " (વૈકલ્પિક)"}
                </span>
                <select
                  value={value}
                  disabled={disabled}
                  onChange={(event) => updatePriority(index, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
                >
                  <option value="">સેવા પસંદ કરો</option>
                  {index === 0 && <option value={NO_SERVICE_ID}>હાલ કોઈ સેવા નથી</option>}
                  {SERVICE_CHANNEL_ORDER.map((channel) => {
                    const services = SERVICE_CATALOG.filter((service) => service.channel === channel);
                    if (!services.length) return null;
                    return <optgroup key={channel} label={channel}>{services.map((service) => (
                      <option key={service.id} value={service.id} disabled={service.id !== value && selected.has(service.id)}>
                        {serviceDisplayLabel(service)}
                      </option>
                    ))}</optgroup>;
                  })}
                </select>
              </label>
            );
          })}
        </div>
        {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 font-semibold text-rose-700">{error}</p>}
        <button type="button" onClick={submitServices} className="mt-6 w-full rounded-xl bg-ink px-6 py-5 text-xl font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800">
          ટેસ્ટ submit કરો →
        </button>
      </section>
    );
  }

  // ── Questions screen ────────────────────────────────────────────────────────
  const statement = statements[currentIndex];
  const progress = currentIndex + 1;

  return (
    <section className="mt-8 rounded-2xl border border-blue-100 bg-white/80 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Second Test</p>
        <span className="rounded-lg bg-blue-50 px-4 py-2 text-base font-black text-blue-700">
          {progress} / {SECOND_TEST_COUNT}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-3 w-full rounded-full bg-slate-100">
        <div
          className="h-3 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(currentIndex / SECOND_TEST_COUNT) * 100}%` }}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="text-xl sm:text-2xl font-bold leading-9 text-slate-900">{statement}</p>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-base font-semibold text-rose-700">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => { setError(""); handleAnswer(true); }}
          className="rounded-xl bg-emerald-600 px-6 py-5 text-xl sm:text-2xl font-black text-white shadow transition hover:bg-emerald-700"
        >
          ✓ &nbsp;હા / Yes
        </button>
        <button
          type="button"
          onClick={() => { setError(""); handleAnswer(false); }}
          className="rounded-xl bg-slate-100 px-6 py-5 text-xl sm:text-2xl font-black text-slate-800 shadow transition hover:bg-slate-200"
        >
          ✗ &nbsp;ના / No
        </button>
      </div>

      <p className="mt-4 text-center text-sm font-semibold text-slate-500">
        એક વખત જવાબ આપ્યા પછી પાછું નહીં આવી શકાય.
      </p>
    </section>
  );
}

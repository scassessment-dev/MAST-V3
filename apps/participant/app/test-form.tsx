"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TEST_INSTRUCTIONS, type OptionCode, type TestBlock } from "@mast/core";

type CenterGroup = {
  id: string;
  name: string;
  centers: Array<{ id: string; name: string }>;
};

type AnswerState = Record<number, { most?: OptionCode; least?: OptionCode }>;

const options: OptionCode[] = ["A", "B", "C", "D"];

export default function TestForm({ blocks }: { blocks: TestBlock[] }) {
  const router = useRouter();
  const [centers, setCenters] = useState<CenterGroup[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"" | "Male" | "Female">("");
  const [centerId, setCenterId] = useState("");
  const [answers, setAnswers] = useState<AnswerState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [step, setStep] = useState<"intro" | "questions">("intro");

  useEffect(() => {
    fetch("/api/centers")
      .then((res) => {
        if (!res.ok) throw new Error("centers failed");
        return res.json();
      })
      .then(setCenters)
      .catch(() => setError("સેન્ટર લોડ કરવામાં સમસ્યા આવી."));
  }, []);

  const completedBlocks = useMemo(
    () => blocks.filter((block) => answers[block.blockNumber]?.most && answers[block.blockNumber]?.least).length,
    [answers, blocks]
  );

  const canStart =
    participantName.trim().length >= 2 &&
    Number(age) >= 8 &&
    Number(age) <= 120 &&
    Boolean(centerId) &&
    Boolean(gender) &&
    hasReadInstructions;

  const isValid =
    participantName.trim().length >= 2 &&
    Number(age) >= 8 &&
    Number(age) <= 120 &&
    centerId &&
    completedBlocks === blocks.length &&
    blocks.every((block) => answers[block.blockNumber]?.most !== answers[block.blockNumber]?.least);

  function choose(blockNumber: number, field: "most" | "least", value: OptionCode) {
    setAnswers((current) => {
      const block = current[blockNumber] ?? {};
      const next = { ...block, [field]: value };
      if (field === "most" && next.least === value) next.least = undefined;
      if (field === "least" && next.most === value) next.most = undefined;
      return { ...current, [blockNumber]: next };
    });
  }

  async function submit() {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName,
          age: Number(age),
          gender,
          centerId,
          answers: blocks.map((block) => ({
            blockNumber: block.blockNumber,
            most: answers[block.blockNumber]?.most,
            least: answers[block.blockNumber]?.least
          }))
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ફોર્મ સબમિટ થયું નથી.");
      router.push(`/result/${payload.responseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ફોર્મ સબમિટ થયું નથી.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "intro") {
    return (
      <section className="glass-panel rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl bg-ink p-5 text-white shadow-2xl shadow-slate-300 sm:p-7">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-200">Participant Details</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">તમારી માહિતી ભરો</h2>
            </div>
            <p className="text-sm font-semibold text-blue-100">Step 1 / 2</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2">
              <span className="text-base font-bold text-blue-50">Name / નામ</span>
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                className="h-14 w-full rounded-xl border border-white/15 bg-white px-4 text-lg font-semibold text-ink outline-none ring-amber-200 focus:ring-4"
                placeholder="તમારું નામ"
              />
            </label>
            <label className="space-y-2">
              <span className="text-base font-bold text-blue-50">Age / ઉંમર</span>
              <input
                value={age}
                onChange={(event) => setAge(event.target.value)}
                type="number"
                min={8}
                max={120}
                className="h-14 w-full rounded-xl border border-white/15 bg-white px-4 text-lg font-semibold text-ink outline-none ring-amber-200 focus:ring-4"
                placeholder="ઉંમર"
              />
            </label>
            <label className="space-y-2">
              <span className="text-base font-bold text-blue-50">Center / સેન્ટર</span>
              <select
                value={centerId}
                onChange={(event) => setCenterId(event.target.value)}
                className="h-14 w-full rounded-xl border border-white/15 bg-white px-4 text-lg font-semibold text-ink outline-none ring-amber-200 focus:ring-4"
              >
                <option value="">સેન્ટર પસંદ કરો</option>
                {centers.map((zone) => (
                  <optgroup key={zone.id} label={zone.name}>
                    {zone.centers.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          {/* Gender */}
          <div className="mt-4">
            <span className="text-base font-bold text-blue-50">Gender / જાતિ</span>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {[
                { value: "Male" as const, label: "પુરુષ", sublabel: "Male", src: "/images/male.png" },
                { value: "Female" as const, label: "સ્ત્રી", sublabel: "Female", src: "/images/female.png" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 transition-all duration-200 ${
                    gender === option.value
                      ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/20"
                      : "border-white/20 bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={option.src}
                      alt={option.sublabel}
                      className={`h-11 w-11 object-contain transition-all duration-200 brightness-0 invert ${
                        gender === option.value
                          ? "scale-110 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <span className={`block text-xl font-black leading-tight transition-colors ${gender === option.value ? "text-amber-200" : "text-white"}`}>
                      {option.label}
                    </span>
                    <span className={`block text-sm font-semibold transition-colors ${gender === option.value ? "text-amber-300" : "text-blue-200"}`}>
                      {option.sublabel}
                    </span>
                  </div>
                  {gender === option.value && (
                    <span className="rounded-full bg-amber-400 px-3 py-0.5 text-xs font-black text-ink">
                      ✓ Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-white/88 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Instructions</p>
              <h2 className="mt-1 text-2xl font-black text-ink">સૂચનાઓ વાંચો</h2>
            </div>
            <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-900">1 વધુ + 1 ઓછું</div>
          </div>
          <div className="mt-4 grid gap-3 text-lg sm:text-xl font-medium leading-9 text-slate-800">
            {TEST_INSTRUCTIONS.map((instruction) => (
              <div key={instruction} className="flex gap-3 rounded-xl bg-slate-50 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-black text-emerald-700">
                  ✓
                </span>
                <p
                  dangerouslySetInnerHTML={{
                    __html: instruction
                      .replace(/"વધુ"/g, '<strong>"વધુ"</strong>')
                      .replace(/"ઓછું"/g, '<strong>"ઓછું"</strong>')
                      .replace(/વધુ/g, '<strong>"વધુ"</strong>')
                      .replace(/ઓછું/g, '<strong>"ઓછું"</strong>')
                  }}
                />
              </div>
            ))}
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <input
              type="checkbox"
              checked={hasReadInstructions}
              onChange={(event) => setHasReadInstructions(event.target.checked)}
              className="mt-1 h-6 w-6 accent-ink"
            />
            <span className="text-lg sm:text-xl font-bold leading-8 text-ink">
              મેં ઉપરની સૂચનાઓ વાંચી છે અને હવે questions શરૂ કરવા તૈયાર છું.
            </span>
          </label>
          {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
          <button
            type="button"
            disabled={!canStart}
            onClick={() => {
              setError("");
              setStep("questions");
            }}
            className="mt-5 w-full rounded-xl bg-ink px-6 py-5 text-xl sm:text-2xl font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Questions શરૂ કરો
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold">Step 2 / 2</p>
            <h2 className="mt-1 text-2xl font-black text-ink">Questions</h2>
            <p className="mt-1 text-base font-semibold text-slate-600">
              {participantName} / દરેક બ્લોકમાં 1 વધુ અને 1 ઓછું પસંદ કરો.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("intro")}
            className="rounded-xl bg-white px-4 py-3 text-base font-bold text-ink ring-1 ring-slate-200"
          >
            Details બદલો
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white/80 px-5 py-4 text-base font-semibold text-slate-700 ring-1 ring-blue-100">
        <span>પ્રગતિ</span>
        <span>
          {completedBlocks} / {blocks.length}
        </span>
      </div>

      <div className="space-y-5">
        {blocks.map((block) => (
          <section key={block.blockNumber} className="glass-panel rounded-2xl p-4 sm:p-5">
            <h2 className="text-center text-3xl font-black text-ink">બ્લોક {block.blockNumber}</h2>
            <div className="mt-4 space-y-3">
              {options.map((option) => (
                <div
                  key={option}
                  className="grid gap-4 rounded-xl border border-slate-100 bg-white/86 p-5 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <p className="text-left text-xl sm:text-2xl font-bold leading-9 text-slate-900">
                    <span className="font-black text-ink">{option}.</span> {block.statements[option]}
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
                    <button
                      type="button"
                      onClick={() => choose(block.blockNumber, "most", option)}
                      className={`rounded-xl px-5 py-4 text-lg sm:text-xl font-black transition ${answers[block.blockNumber]?.most === option
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                        }`}
                    >
                      વધુ
                    </button>
                    <button
                      type="button"
                      onClick={() => choose(block.blockNumber, "least", option)}
                      className={`rounded-xl px-5 py-4 text-lg sm:text-xl font-black transition ${answers[block.blockNumber]?.least === option
                          ? "bg-rose-600 text-white"
                          : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                        }`}
                    >
                      ઓછું
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      <button
        type="button"
        disabled={!isValid || isSubmitting}
        onClick={submit}
        className="w-full rounded-xl bg-ink px-6 py-5 text-xl sm:text-2xl font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "સબમિટ થઈ રહ્યું છે..." : "ટેસ્ટ સબમિટ કરો"}
      </button>
    </div>
  );
}

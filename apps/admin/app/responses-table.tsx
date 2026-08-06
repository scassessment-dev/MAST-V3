"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";

/* ---------- Types ---------- */

type AdminRole = "MASTER_ADMIN" | "ZONE_ADMIN" | "CENTER_ADMIN";

type SessionInfo = {
  role: AdminRole;
  zoneId: string | null;
  centerId: string | null;
};

type Zone = {
  id: string;
  name: string;
  centers: Array<{ id: string; name: string }>;
};

export type ResponseRow = {
  id: string;
  participantName: string;
  age: number;
  gender: string;
  scoreM: number;
  scoreA: number;
  scoreS: number;
  scoreT: number;
  primaryType: string;
  secondaryType: string;
  submittedAt: string; // ISO string (serialized from server)
  center: { name: string; zone: { name: string } };
  valid: string | null;
};

type Filters = {
  search: string;
  zoneId: string;
  centerId: string;
  primaryType: string;
  gender: string;
  valid: string;
  from: string;
  to: string;
};

/* ---------- Constants ---------- */

const MAST_TYPES = ["M", "A", "S", "T"] as const;
const TYPE_LABELS: Record<string, string> = {
  M: "M — મિલનસાર",
  A: "A — આદેશક",
  S: "S — સહયોગી",
  T: "T — તર્કબદ્ધ",
};
const TYPE_COLORS: Record<string, string> = {
  M: "bg-emerald-50 text-emerald-700",
  A: "bg-amber-50  text-amber-700",
  S: "bg-sky-50    text-sky-700",
  T: "bg-violet-50 text-violet-700",
};

const EMPTY_FILTERS: Filters = {
  search: "",
  zoneId: "",
  centerId: "",
  primaryType: "",
  gender: "",
  valid: "",
  from: "",
  to: "",
};

/* ---------- Component ---------- */

export default function ResponsesTable({
  session,
  initialRows,
  initialTotal,
  zones,
}: {
  session: SessionInfo;
  initialRows: ResponseRow[];
  initialTotal: number;
  zones: Zone[];
}) {
  const [rows, setRows] = useState<ResponseRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  /* ---- Role capabilities ---- */
  const isMaster = session.role === "MASTER_ADMIN";
  const isZone = session.role === "ZONE_ADMIN";
  const canFilterZone = isMaster;
  const canFilterCenter = isMaster || isZone;

  /* ---- Centers for dropdown ---- */
  const centersForDropdown = isMaster
    ? (filters.zoneId
        ? (zones.find((z) => z.id === filters.zoneId)?.centers ?? [])
        : zones.flatMap((z) => z.centers))
    : isZone
    ? (zones.find((z) => z.id === session.zoneId)?.centers ?? [])
    : [];

  /* ---- Fetch rows from API ---- */
  const fetchRows = useCallback((f: Filters) => {
    startTransition(async () => {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.zoneId) params.set("zoneId", f.zoneId);
      if (f.centerId) params.set("centerId", f.centerId);
      if (f.primaryType) params.set("primaryType", f.primaryType);
      if (f.gender) params.set("gender", f.gender);
      if (f.valid) params.set("valid", f.valid);
      if (f.from) params.set("from", new Date(f.from).toISOString());
      if (f.to) {
        const toDate = new Date(f.to);
        toDate.setHours(23, 59, 59, 999);
        params.set("to", toDate.toISOString());
      }
      params.set("pageSize", "200");

      const res = await fetch(`/api/admin/responses?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.rows);
      setTotal(data.total);
      setSelectedIds(new Set());
    });
  }, []);

  function applyFilters() {
    fetchRows(filters);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    fetchRows(EMPTY_FILTERS);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") applyFilters();
  }

  /* ---- Checkbox logic ---- */
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ---- Delete ---- */
  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/responses/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowConfirm(false);
      fetchRows(filters);
    } catch {
      setDeleteError("Delete error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const selectedCount = selectedIds.size;
  const selectedNames = rows
    .filter((r) => selectedIds.has(r.id))
    .slice(0, 3)
    .map((r) => r.participantName);

  /* ---- Render ---- */
  return (
    <div className="panel rounded-2xl p-5">

      {/* ── Filters ── */}
      <div className="mb-3">
        <h2 className="mb-3 text-xl font-bold text-ink">Responses</h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {/* Name search */}
          <input
            placeholder="Search by name…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          />

          {/* Zone (master only) */}
          {canFilterZone && (
            <select
              value={filters.zoneId}
              onChange={(e) =>
                setFilters((f) => ({ ...f, zoneId: e.target.value, centerId: "" }))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          )}

          {/* Center (master + zone) */}
          {canFilterCenter && (
            <select
              value={filters.centerId}
              onChange={(e) => setFilters((f) => ({ ...f, centerId: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Centers</option>
              {centersForDropdown.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Primary Type */}
          <select
            value={filters.primaryType}
            onChange={(e) => setFilters((f) => ({ ...f, primaryType: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Types</option>
            {MAST_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          {/* Gender */}
          <select
            value={filters.gender}
            onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* Valid */}
          <select
            value={filters.valid}
            onChange={(e) => setFilters((f) => ({ ...f, valid: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Results</option>
            <option value="Valid">Valid</option>
            <option value="Invalid">Invalid</option>
            <option value="Pending">Pending</option>
          </select>

          {/* From date */}
          <div className="relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-400">
              From
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* To date */}
          <div className="relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-400">
              To
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Filter action buttons */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={applyFilters}
            disabled={isPending}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Loading…" : "Apply Filters"}
          </button>
          <button
            onClick={clearFilters}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
          <a
            href={(() => {
              const params = new URLSearchParams();
              if (filters.search) params.set("search", filters.search);
              if (filters.zoneId) params.set("zoneId", filters.zoneId);
              if (filters.centerId) params.set("centerId", filters.centerId);
              if (filters.primaryType) params.set("primaryType", filters.primaryType);
              if (filters.gender) params.set("gender", filters.gender);
              if (filters.valid) params.set("valid", filters.valid);
              if (filters.from) params.set("from", new Date(filters.from).toISOString());
              if (filters.to) {
                const toDate = new Date(filters.to);
                toDate.setHours(23, 59, 59, 999);
                params.set("to", toDate.toISOString());
              }
              const query = params.toString();
              return query ? `/api/admin/responses/export?${query}` : `/api/admin/responses/export`;
            })()}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-slate-50"
          >
            📥 Export CSV ({total})
          </a>
          <span className="ml-auto text-sm text-slate-500">
            {isPending ? "…" : `${total} total`}
          </span>
        </div>
      </div>

      {/* ── Delete action bar ── */}
      {someSelected && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm font-semibold text-red-700">
            {selectedCount} entry selected
          </span>
          <button
            onClick={() => { setDeleteError(""); setShowConfirm(true); }}
            className="ml-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            🗑&nbsp; Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="border-b border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-red-600"
                  title="Select all"
                />
              </th>
              <th className="border-b border-slate-200 p-3">Name</th>
              <th className="border-b border-slate-200 p-3">Age</th>
              <th className="border-b border-slate-200 p-3">Gender</th>
              <th className="border-b border-slate-200 p-3">Zone</th>
              <th className="border-b border-slate-200 p-3">Center</th>
              <th className="border-b border-slate-200 p-3 text-center">M</th>
              <th className="border-b border-slate-200 p-3 text-center">A</th>
              <th className="border-b border-slate-200 p-3 text-center">S</th>
              <th className="border-b border-slate-200 p-3 text-center">T</th>
              <th className="border-b border-slate-200 p-3">Primary</th>
              <th className="border-b border-slate-200 p-3">Valid</th>
              <th className="border-b border-slate-200 p-3">Submitted</th>
              <th className="border-b border-slate-200 p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const checked = selectedIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={() => toggleOne(row.id)}
                  className={`cursor-pointer border-b border-slate-100 transition-colors last:border-0 ${
                    checked ? "bg-red-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 cursor-pointer accent-red-600"
                    />
                  </td>
                  <td className="p-3 font-semibold text-ink">{row.participantName}</td>
                  <td className="p-3 text-slate-600">{row.age}</td>
                  <td className="p-3 text-slate-600">{row.gender}</td>
                  <td className="p-3 text-slate-600">{row.center.zone.name}</td>
                  <td className="p-3 text-slate-600">{row.center.name}</td>
                  <td className="p-3 text-center font-mono text-slate-700">{row.scoreM}</td>
                  <td className="p-3 text-center font-mono text-slate-700">{row.scoreA}</td>
                  <td className="p-3 text-center font-mono text-slate-700">{row.scoreS}</td>
                  <td className="p-3 text-center font-mono text-slate-700">{row.scoreT}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${TYPE_COLORS[row.primaryType] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {row.primaryType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        row.valid === "Valid"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.valid === "Invalid"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {row.valid ?? "Pending"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {new Date(row.submittedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/responses/${row.id}`}
                      className="font-bold text-blue-700 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isPending && (
          <div className="flex items-center justify-center gap-2 p-8 text-slate-400">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading…
          </div>
        )}
        {!isPending && rows.length === 0 && (
          <p className="p-8 text-center text-slate-500">No responses found.</p>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md rounded-2xl p-6 shadow-2xl">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h3 className="mt-4 text-xl font-bold text-ink">
              Delete {selectedCount} {selectedCount === 1 ? "entry" : "entries"}?
            </h3>

            {/* Preview names */}
            <ul className="mt-2 space-y-0.5">
              {selectedNames.map((name, i) => (
                <li key={i} className="text-sm text-slate-600">• {name}</li>
              ))}
              {selectedCount > 3 && (
                <li className="text-sm text-slate-400">
                  … ane {selectedCount - 3} vadhu
                </li>
              )}
            </ul>

            <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              ⚠ Aa action undone nahi thay.
            </p>

            {deleteError && (
              <p className="mt-2 text-sm text-red-600">{deleteError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Deleting…
                  </span>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

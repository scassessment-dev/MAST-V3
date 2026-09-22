"use client";

import { MAST_TYPE_THEME, type MastType } from "@mast/core";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ResultChart({ scores }: { scores: Array<{ type: string; label: string; score: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={scores}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce7f5" />
          <XAxis dataKey="type" />
          <YAxis domain={[0, 20]} allowDecimals={false} />
          <Tooltip formatter={(value, _name, item) => [`${value}`, item.payload.label]} />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            {scores.map((score) => <Cell key={score.type} fill={MAST_TYPE_THEME[score.type as MastType]?.accentHex ?? "#64748b"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

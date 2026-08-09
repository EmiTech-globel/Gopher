"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DailyPoint {
  date: string; // e.g. "Aug 5"
  completed: number;
}

export function ErrandsActivityChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <p className="mb-4 text-sm font-medium text-foreground">Errands completed per day (last 14 days)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, (dataMax: number) => Math.max(5, dataMax + 1)]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "#f9fafb" }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          />
          <Bar dataKey="completed" fill="#532b59" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

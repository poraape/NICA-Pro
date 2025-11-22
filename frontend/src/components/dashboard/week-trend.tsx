"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export type WeekTrendPoint = {
  day: string;
  calories: number;
  status: string;
  trend: number;
};

interface WeekTrendChartProps {
  data: WeekTrendPoint[];
  statusColors: Record<string, string>;
}

export function WeekTrendChart({ data, statusColors }: WeekTrendChartProps) {
  return (
    <div className="h-64" aria-live="polite">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="4 4" opacity={0.3} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip cursor={{ opacity: 0.1 }} />
          <Bar dataKey="calories" barSize={24} radius={[10, 10, 10, 10]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.status] ?? "#38bdf8"} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="trend" stroke="#0a84ff" strokeWidth={3} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

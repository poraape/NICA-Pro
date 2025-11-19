"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface WeeklyChartProps {
  data: Array<{ label: string; calories: number; goal?: number }>;
  goal?: number | null;
}

export function WeeklyCaloriesChart({ data, goal }: WeeklyChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <YAxis hide domain={[0, (goal ?? 2000) * 1.4]} />
          <Tooltip
            contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
            formatter={(value: number) => [`${Math.round(value)} kcal`, "Calorias"]}
          />
          {goal ? <ReferenceLine y={goal} stroke="#c4b5fd" strokeDasharray="4 4" /> : null}
          <Area
            type="monotone"
            dataKey="calories"
            stroke="#0ea5e9"
            fillOpacity={1}
            fill="url(#colorCalories)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

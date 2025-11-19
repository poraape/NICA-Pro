"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend
} from "recharts";
import type { DashboardChart } from "@/lib/api";

interface ChartRendererProps {
  chart: DashboardChart;
}

export function ChartRenderer({ chart }: ChartRendererProps) {
  if (chart.type === "radar") {
    const labels = (chart.data.labels as string[]) ?? [];
    const target = (chart.data.target as number[]) ?? [];
    const actual = (chart.data.actual as number[]) ?? [];
    const data = labels.map((label, index) => ({
      subject: label,
      Target: target[index] ?? 0,
      Atual: actual[index] ?? 0
    }));
    return (
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid strokeDasharray="4 4" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8" }} />
          <PolarRadiusAxis tick={{ fill: "#94a3b8" }} />
          <Radar name="Meta" dataKey="Target" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
          <Radar name="Atual" dataKey="Atual" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie") {
    const labels = (chart.data.labels as string[]) ?? [];
    const values = (chart.data.values as number[]) ?? [];
    const data = labels.map((label, idx) => ({ name: label, value: values[idx] ?? 0 }));
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            stroke="none"
          />
          <Tooltip formatter={(value: number) => `${value.toFixed(0)} g`} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "timeline") {
    const labels = (chart.data.labels as string[]) ?? [];
    const values = (chart.data.values as number[]) ?? [];
    const data = labels.map((label, idx) => ({ label, value: values[idx] ?? 0 }));
    return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, left: 0, right: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" opacity={0.4} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis hide />
          <Tooltip formatter={(value: number) => `${value.toFixed(0)} g`} />
          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={0.25} fill="#0ea5e9" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  const target = Number(chart.data.target ?? 0);
  const actual = Number(chart.data.actual ?? 0);
  const data = [
    { label: "Meta", value: target },
    { label: "Atual", value: actual }
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
        <YAxis hide />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)} L`} />
        <Bar dataKey="value" radius={[12, 12, 12, 12]} fill="#34d399" />
      </BarChart>
    </ResponsiveContainer>
  );
}

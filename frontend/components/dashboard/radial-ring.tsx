"use client";

import { cn } from "@/lib/utils";

interface RadialRingProps {
  label: string;
  value: number;
  goal?: number | null;
  unit: string;
  color: string;
}

export function RadialRing({ label, value, goal, unit, color }: RadialRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = goal && goal > 0 ? Math.min(1, value / goal) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white/80 p-5 shadow-inner shadow-white/40">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          className="text-slate-200"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
          opacity={0.6}
        />
        <circle
          className="transition-all"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
          transform="rotate(-90 70 70)"
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.3em" className="fill-slate-900 text-2xl font-semibold">
          {Math.round(value)}
        </text>
        <text x="50%" y="65%" textAnchor="middle" className="fill-slate-500 text-xs font-medium uppercase">
          {unit}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
        <p className="text-sm text-slate-500">Meta: {goal ? `${Math.round(goal)} ${unit}` : "-"}</p>
        <p
          className={cn(
            "text-sm font-semibold",
            progress >= 1 ? "text-emerald-600" : "text-slate-900"
          )}
        >
          {Math.round(progress * 100)}% completo
        </p>
      </div>
    </div>
  );
}

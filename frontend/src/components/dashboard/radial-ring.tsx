"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadialRingProps {
  label: string;
  value: number;
  goal?: number | null;
  unit: string;
  color: string;
  icon?: string;
}

export function RadialRing({ label, value, goal, unit, color, icon }: RadialRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = goal && goal > 0 ? Math.min(1, value / goal) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/80 p-5",
        "shadow-[0_1px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:bg-white/10"
      )}
    >
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          className="text-slate-200 dark:text-white/10"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
          opacity={0.4}
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
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          className="fill-slate-900 text-2xl font-semibold dark:fill-white"
        >
          {Math.round(value)}
        </text>
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          className="fill-slate-500 text-xs font-medium uppercase dark:fill-slate-300"
        >
          {unit}
        </text>
      </svg>
      <div className="text-center">
        <p className="flex items-center justify-center gap-1 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
          {icon && <span className="text-base text-slate-400 dark:text-slate-100">{icon}</span>}
          {label}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-200">
          Meta: {goal ? `${Math.round(goal)} ${unit}` : "-"}
        </p>
        <p
          className={cn(
            "text-sm font-semibold",
            progress >= 1 ? "text-emerald-500" : "text-slate-900 dark:text-white"
          )}
        >
          {Math.round(progress * 100)}% completo
        </p>
      </div>
    </motion.div>
  );
}

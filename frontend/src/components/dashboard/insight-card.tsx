"use client";

import { motion } from "framer-motion";

interface InsightCardProps {
  title: string;
  body: string;
  severity?: "info" | "success" | "warning" | "critical";
  index: number;
}

const severityMap: Record<string, string> = {
  info: "border-sky-200/60 bg-sky-50/70 text-sky-800 dark:border-sky-300/40 dark:bg-sky-400/10 dark:text-sky-100",
  success: "border-emerald-200/60 bg-emerald-50/80 text-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100",
  warning: "border-amber-200/60 bg-amber-50/80 text-amber-800 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100",
  critical: "border-rose-300/60 bg-rose-50/80 text-rose-800 dark:border-rose-300/40 dark:bg-rose-400/10 dark:text-rose-100"
};

export function InsightCard({ title, body, severity = "info", index }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={`rounded-3xl border p-4 text-sm shadow-lg shadow-slate-900/5 backdrop-blur ${severityMap[severity]}`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{body}</p>
    </motion.div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const toneStyles: Record<string, string> = {
  success: "bg-emerald-500/90 text-white shadow-emerald-500/40",
  warning: "bg-amber-400/90 text-slate-900 shadow-amber-500/30",
  error: "bg-rose-500/90 text-white shadow-rose-500/40",
  info: "bg-slate-900/90 text-white shadow-slate-900/30"
};

export function ToastViewport() {
  const { toasts } = useAppState();

  return (
    <div
      aria-live="polite"
      aria-label="Notificações"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:right-6"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className={cn(
              "pointer-events-auto rounded-3xl px-4 py-3 shadow-2xl backdrop-blur-xl",
              "border border-white/15 ring-1 ring-white/20",
              toneStyles[toast.tone]
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden>{toast.tone === "success" ? "􀎸" : toast.tone === "error" ? "􀇿" : "􀅴"}</span>
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.description && <p className="text-xs leading-snug opacity-90">{toast.description}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

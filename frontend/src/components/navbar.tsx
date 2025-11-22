"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "􀊯" },
  { href: "/dashboard/history", label: "Histórico", icon: "􀙇" },
  { href: "/dashboard/alerts/overview", label: "Alertas", icon: "􀝖" },
  { href: "/meals/today", label: "Refeições", icon: "􀎞" },
  { href: "/onboarding", label: "Perfil", icon: "􀉩" }
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/60 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden className="text-xl">􀞚</span>
          NICA-Pro
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 rounded-full bg-white/40 p-1 shadow-inner shadow-white/20 backdrop-blur-lg dark:bg-white/10 dark:shadow-slate-900/40">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  )}
                >
                  <span aria-hidden className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "auto" : "dark")}
            className="rounded-full border border-white/30 bg-white/60 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-white/20 dark:bg-slate-800/80 dark:text-white"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? "􀛨" : theme === "light" ? "􀆮" : "􀷘"}
          </button>
        </div>
      </div>
    </nav>
  );
}

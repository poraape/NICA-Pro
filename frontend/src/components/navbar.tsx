"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "􀊯" },
  { href: "/meals/today", label: "Refeições", icon: "􀎞" },
  { href: "/onboarding", label: "Perfil", icon: "􀉩" }
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/60 text-slate-900 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden className="text-xl">􀞚</span>
          NICA-Pro
        </Link>
        <div className="flex gap-2 rounded-full bg-white/40 p-1 dark:bg-white/10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition",
                pathname?.startsWith(link.href)
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              )}
            >
              <span aria-hidden className="text-base">
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

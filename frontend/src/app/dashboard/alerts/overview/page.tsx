"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppState } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsOverviewPage() {
  const { profile, refreshDashboard, dashboard, loading } = useAppState();

  useEffect(() => {
    if (profile.name && !dashboard && !loading) {
      void refreshDashboard();
    }
  }, [profile.name, dashboard, loading, refreshDashboard]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Alertas</p>
        <h1 className="text-3xl font-semibold">Painel de alertas</h1>
        <p className="text-sm text-slate-600">Links dedicados para cada recomendação crítica.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {(dashboard?.alerts ?? []).map((alert, index) => (
          <Card key={alert.title} className="border border-white/20 bg-white/70 backdrop-blur transition hover:-translate-y-0.5 dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span aria-hidden>􀝖</span>
                {alert.title}
              </CardTitle>
              <CardDescription>{alert.severity}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-200">
              <p className="mb-3 leading-relaxed">{alert.detail}</p>
              <Link href={`/dashboard/alerts/${index}`} className="font-semibold text-brand underline">
                Abrir detalhes
              </Link>
            </CardContent>
          </Card>
        ))}
        {(dashboard?.alerts ?? []).length === 0 && <p className="text-sm text-slate-500">Nenhum alerta disponível. Sincronize o diário.</p>}
      </div>
    </section>
  );
}

"use client";

import { useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertDetailPage() {
  const params = useParams<{ alertId?: string }>();
  const alertIndex = Number(params.alertId ?? "-1");
  const { profile, refreshDashboard, dashboard, loading } = useAppState();

  useEffect(() => {
    if (profile.name && !dashboard && !loading) {
      void refreshDashboard();
    }
  }, [profile.name, dashboard, loading, refreshDashboard]);

  const alertList = dashboard?.alerts ?? [];
  const alert = Number.isNaN(alertIndex) ? undefined : alertList[alertIndex];
  if (!alert) {
    return notFound();
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Alertas</p>
        <h1 className="text-3xl font-semibold">{alert.title}</h1>
        <p className="text-sm text-slate-600">Rastreamento clínico e justificativa detalhada.</p>
      </header>

      <Card className="border border-white/20 bg-white/70 shadow-xl backdrop-blur dark:bg-slate-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span aria-hidden>􀒳</span>
            {alert.title}
          </CardTitle>
          <CardDescription>{alert.detail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-200">
            Severidade: <span className="font-semibold">{alert.severity}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-200">
            Cada alerta mantém idempotência e versionamento do payload, permitindo rastrear o plano enviado e as entradas de diário
            associadas.
          </p>
          <Link href="/dashboard" className="text-sm font-semibold text-brand underline">
            Voltar ao dashboard
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

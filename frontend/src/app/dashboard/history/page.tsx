"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const { dashboard, profile, refreshDashboard, loading } = useAppState();
  const [filter, setFilter] = useState<string>(searchParams.get("nutriente") ?? "");

  useEffect(() => {
    if (profile.name && !dashboard && !loading) {
      void refreshDashboard();
    }
  }, [profile.name, dashboard, loading, refreshDashboard]);

  const micronutrients = dashboard?.today?.micronutrients ?? [];
  const filtered = useMemo(() => {
    if (!dashboard?.week) return [];
    if (!filter) return dashboard.week.bars;
    return dashboard.week.bars.filter((bar) => bar.status === "target" || bar.day.toLowerCase().includes(filter.toLowerCase()));
  }, [dashboard, filter]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Histórico</p>
        <h1 className="text-3xl font-semibold">Deep links por nutriente</h1>
        <p className="text-sm text-slate-600">Filtre por micronutrientes e acesse semanas anteriores.</p>
      </header>

      <Card className="border border-white/20 bg-white/70 shadow-xl backdrop-blur dark:bg-slate-900/60">
        <CardHeader>
          <CardTitle>Filtro por nutriente</CardTitle>
          <CardDescription>Carrega o histórico por foco clínico.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por nutriente">
            <option value="">Todos</option>
            {micronutrients.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <div className="text-xs text-slate-500">{filtered.length} dias encontrados</div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((day) => (
          <Card key={day.day} className="border border-white/20 bg-white/70 backdrop-blur dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{day.day}</span>
                <span className="text-xs text-slate-500">{day.status}</span>
              </CardTitle>
              <CardDescription>{day.calories} kcal</CardDescription>
            </CardHeader>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">Nada sincronizado ainda. Cadastre um diário.</p>}
      </div>

      <div className="rounded-2xl border border-dashed border-white/30 bg-white/50 px-4 py-3 text-sm text-slate-600 backdrop-blur dark:bg-slate-900/40">
        Precisa voltar? <Link href="/dashboard" className="underline">Voltar ao painel</Link>
      </div>
    </section>
  );
}

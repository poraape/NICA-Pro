"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import type { ProfilePayload } from "@/lib/api";
import { RadialRing } from "@/components/dashboard/radial-ring";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { WeekTrendPoint } from "@/components/dashboard/week-trend";

const statusColors: Record<string, string> = {
  above: "#ff375f",
  target: "#32d74b",
  below: "#ffd60a"
};

const ChartRenderer = dynamic(
  () => import("@/components/dashboard/chart-renderer").then((mod) => mod.ChartRenderer),
  {
    ssr: false,
    loading: () => (
      <div
        aria-label="Carregando visualização"
        className="h-64 w-full rounded-3xl border border-white/30 bg-white/50 shadow-inner shadow-white/20 backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
      />
    )
  }
);

const WeekTrendChart = dynamic(
  () => import("@/components/dashboard/week-trend").then((mod) => mod.WeekTrendChart),
  {
    ssr: false,
    loading: () => (
      <div
        aria-label="Carregando tendência semanal"
        className="h-64 w-full rounded-3xl border border-white/30 bg-white/50 shadow-inner shadow-white/20 backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
      />
    )
  }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-3xl border border-white/30 bg-white/60 shadow-inner shadow-white/20 backdrop-blur dark:border-white/10 dark:bg-slate-900/40"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-3xl border border-white/20 bg-white/70 backdrop-blur dark:bg-slate-900/60 lg:col-span-2" />
        <div className="h-72 rounded-3xl border border-white/20 bg-white/70 backdrop-blur dark:bg-slate-900/60" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    profile,
    diary,
    dashboard,
    loading,
    syncing,
    updateProfile,
    updateDiaryDraft,
    addDiaryEntry,
    removeDiaryEntry,
    refreshDashboard,
    syncDiary,
    pushToast
  } = useAppState();

  useEffect(() => {
    if (profile.name && !dashboard && !loading) {
      void refreshDashboard();
    }
  }, [profile.name, dashboard, loading, refreshDashboard]);

  const caloricProfile = dashboard?.caloric_profile ?? null;
  const ringData = useMemo(() => {
    if (!dashboard?.today) return [];
    const metrics = [...dashboard.today.metrics, dashboard.today.hydration];
    return metrics.map((metric) => ({
      label: metric.label,
      value: metric.current,
      goal: metric.target,
      unit: metric.unit,
      color: metric.color,
      icon: metric.icon
    }));
  }, [dashboard]);

  const micronutrients = dashboard?.today?.micronutrients ?? [];
  const todayInsights = dashboard?.today?.insights ?? [];
  const weekHighlights = dashboard?.week?.highlights ?? [];
  const weekData: WeekTrendPoint[] = useMemo(() => {
    if (!dashboard?.week) return [];
    return dashboard.week.bars.map((bar, index) => ({
      ...bar,
      trend: dashboard.week.trend_line[index] ?? bar.calories
    }));
  }, [dashboard]);
  const mealInsights = dashboard?.meal_insights ?? [];
  const alerts = dashboard?.alerts ?? [];
  const navigationCards = dashboard?.navigation ?? [];

  const charts = useMemo(() => dashboard?.charts ?? [], [dashboard]);

  const coachMessages = dashboard?.coach_messages ?? [];

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile.name) {
      pushToast({ title: "Informe um identificador", description: "Escolha um nome para salvar e sincronizar seus dados.", tone: "warning" });
      return;
    }
    await refreshDashboard();
  };

  const handleAddDiary = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addDiaryEntry(diary.draftText);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300">NICA Multi-Agent</p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">Coach Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-200">
            Planner → Diário → Calc → Trend → Coach → UI. Um circuito automatizado com validação clínica,
            anéis responsivos e microinterações inspiradas no iOS.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Button
            onClick={() => refreshDashboard()}
            disabled={loading || !profile.name}
            className="gap-2 rounded-full px-6 py-5 shadow-lg shadow-brand/30 transition hover:-translate-y-0.5"
          >
            <span aria-hidden>􀣺</span>
            {loading ? "Sincronizando..." : "Atualizar pipeline"}
          </Button>
          {profile.name && (
            <p className="text-xs text-slate-500 dark:text-slate-300">Sessão ativa para {profile.name}</p>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border border-white/30 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 lg:col-span-2">
          <CardHeader>
            <CardTitle>Perfil clínico</CardTitle>
            <CardDescription>Substitui os mocks: salvamos seu perfil e recalibramos o plano.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Identificador</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Ex: atleta-julia"
                  required
                />
                <p className="text-xs text-slate-500">Use rótulos distintos para sessões diferentes.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select id="sex" value={profile.sex} onChange={(e) => updateProfile({ sex: e.target.value as ProfilePayload["sex"] })}>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Outro</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  min={12}
                  max={90}
                  value={profile.age}
                  onChange={(e) => updateProfile({ age: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min={120}
                  max={230}
                  value={profile.height_cm}
                  onChange={(e) => updateProfile({ height_cm: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min={35}
                  max={250}
                  value={profile.weight_kg}
                  onChange={(e) => updateProfile({ weight_kg: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity_level">Atividade</Label>
                <Select
                  id="activity_level"
                  value={profile.activity_level}
                  onChange={(e) => updateProfile({ activity_level: e.target.value as ProfilePayload["activity_level"] })}
                >
                  <option value="sedentary">Sedentário</option>
                  <option value="light">Leve</option>
                  <option value="moderate">Moderado</option>
                  <option value="intense">Intenso</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Select id="goal" value={profile.goal} onChange={(e) => updateProfile({ goal: e.target.value as ProfilePayload["goal"] })}>
                  <option value="cut">Secar</option>
                  <option value="maintain">Manter</option>
                  <option value="bulk">Hipertrofia</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading || !profile.name} className="w-full rounded-2xl py-3">
                  {loading ? "Recalculando..." : "Salvar e recalibrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-white/30 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle>Diário inteligente</CardTitle>
            <CardDescription>Persistência real com múltiplas entradas e rascunho salvo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddDiary} className="space-y-3">
              <Label htmlFor="diary-entry">Adicionar entrada</Label>
              <Textarea
                id="diary-entry"
                value={diary.draftText}
                onChange={(e) => updateDiaryDraft(e.target.value)}
                placeholder="iogurte grego 200g"
                className="min-h-[72px] rounded-2xl border border-white/40 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-900/50"
              />
              <Button type="submit" variant="secondary" className="w-full rounded-2xl py-2" disabled={!diary.draftText.trim()}>
                Registrar na fila
              </Button>
            </form>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Entradas prontas ({diary.entries.length})</p>
              <ul className="space-y-2 text-sm">
                {diary.entries.map((entry, index) => (
                  <li
                    key={entry + index}
                    className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/80 px-3 py-2 text-slate-700 shadow-inner backdrop-blur dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
                  >
                    <span>{entry}</span>
                    <button
                      type="button"
                      onClick={() => removeDiaryEntry(index)}
                      className="rounded-full px-2 py-1 text-xs text-rose-500 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 dark:hover:bg-rose-500/10"
                      aria-label="Remover entrada"
                    >
                      􀈑
                    </button>
                  </li>
                ))}
                {diary.entries.length === 0 && <li className="text-xs text-slate-500">Nenhuma entrada ainda.</li>}
              </ul>
            </div>
            <Button
              onClick={() => syncDiary()}
              disabled={syncing || !diary.entries.length}
              className="w-full rounded-2xl py-3 shadow-md shadow-brand/20"
            >
              {syncing ? "Enviando..." : "Sincronizar diário"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading && <DashboardSkeleton />}

      {!loading && dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ringData.map((ring) => (
              <RadialRing key={ring.label} {...ring} />
            ))}
          </div>

          {dashboard.today && (
            <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle>Hoje</CardTitle>
                <CardDescription>Anéis de progresso, micronutrientes-chave e insights táticos.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Micronutrientes-chave</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-200">
                    {micronutrients.map((item) => (
                      <li
                        key={item}
                        className="rounded-2xl border border-white/20 bg-white/80 px-3 py-2 shadow-inner backdrop-blur dark:bg-white/10"
                      >
                        <Link href={`/dashboard/history?nutriente=${encodeURIComponent(item)}`} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Insights imediatos</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-200">
                    {todayInsights.map((item) => (
                      <li key={item} className="rounded-2xl border border-white/10 bg-white/70 px-3 py-2 shadow dark:bg-white/10">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {weekData.length > 0 && (
              <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60 lg:col-span-2">
              <CardHeader>
                <CardTitle>Semana</CardTitle>
                <CardDescription>Barras diárias + tendência calórica conectada ao Trend-Agent.</CardDescription>
              </CardHeader>
              <CardContent>
                <WeekTrendChart data={weekData} statusColors={statusColors} />
              </CardContent>
            </Card>
          )}

            <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle>Planos e status</CardTitle>
                <CardDescription>Resumo clínico da versão mais recente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {caloricProfile && (
                  <InsightCard
                    title="Gasto energético"
                    subtitle={`${Math.round(caloricProfile.get)} kcal • TMB ${Math.round(caloricProfile.tmb)} kcal`}
                    status="ativo"
                    trend="􀊄"
                  />
                )}
                {weekHighlights.map((item) => (
                  <InsightCard key={item} title={item} subtitle="Trend-Agent" status="alerta" trend="􀜟" />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle>Inspeção das refeições</CardTitle>
                <CardDescription>Deep-link para detalhes por refeição.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mealInsights.map((meal) => (
                  <InsightCard
                    key={meal.name}
                    title={`${meal.name} • ${meal.calories} kcal`}
                    subtitle={`${meal.adjustment} (${meal.impact})`}
                    status="coaching"
                    trend={meal.time}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle>Alertas clínicos</CardTitle>
                <CardDescription>Explore detalhes com links dedicados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <Link key={alert.title} href={`/dashboard/alerts/${index}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                    <InsightCard
                      title={alert.title}
                      subtitle={alert.detail}
                      status={alert.severity}
                      trend="􀒳"
                    />
                  </Link>
                ))}
                {alerts.length === 0 && <p className="text-sm text-slate-500">Sem alertas críticos agora.</p>}
              </CardContent>
            </Card>
          </div>

          {charts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Navegação e gráficos</h2>
                <p className="text-xs text-slate-500">Profundidade por agente com links reais.</p>
              </div>
              <ChartRenderer charts={charts} />
              <div className="grid gap-3 md:grid-cols-2">
                {navigationCards.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-2xl border border-white/20 bg-white/70 px-4 py-3 text-sm shadow backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:bg-slate-900/60">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-100">
                      <span aria-hidden>{item.icon}</span>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {coachMessages.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Mensagens do Coach</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {coachMessages.map((message) => (
                  <Card
                    key={message.title}
                    className="border border-white/20 bg-white/70 shadow-lg backdrop-blur transition hover:-translate-y-0.5 dark:bg-slate-900/60"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span aria-hidden>{message.severity === "critical" ? "􀇿" : "􀎸"}</span>
                        {message.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-600 dark:text-slate-200">{message.body}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </motion.section>
  );
}

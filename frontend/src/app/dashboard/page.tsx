"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  fetchDashboard,
  syncDiary,
  upsertPlan,
  type DashboardResponse,
  type NutritionPlanResponse,
  type ProfilePayload
} from "@/lib/api";
import { RadialRing } from "@/components/dashboard/radial-ring";
import { ChartRenderer } from "@/components/dashboard/chart-renderer";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const defaultProfile: ProfilePayload = {
  name: "NICA Athlete",
  age: 32,
  weight_kg: 72,
  height_cm: 176,
  sex: "female",
  activity_level: "moderate",
  goal: "maintain"
};

const sampleDiary = [
  "iogurte grego-200g",
  "overnight oats-150g",
  "salmao selado-180g",
  "agua de coco-300ml"
];

const statusColors: Record<string, string> = {
  above: "#ff375f",
  target: "#32d74b",
  below: "#ffd60a"
};

export default function DashboardPage() {
  const [plan, setPlan] = useState<NutritionPlanResponse["plan"] | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse["dashboard"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const planResponse = await upsertPlan(defaultProfile);
        setPlan(planResponse.plan);
        const dashboardResponse = await fetchDashboard(defaultProfile.name);
        setDashboard(dashboardResponse.dashboard);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const caloricProfile = plan?.caloric_profile;
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
  const weekData = useMemo(() => {
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

  const handleDiarySync = async () => {
    try {
      setSyncing(true);
      setSuccess(null);
      await upsertPlan(defaultProfile);
      await syncDiary({ user: defaultProfile.name, entries: sampleDiary });
      const refreshed = await fetchDashboard(defaultProfile.name);
      setDashboard(refreshed.dashboard);
      setSuccess("Diário sincronizado com sucesso");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao sincronizar diário");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 text-center text-slate-500">
        <p className="text-sm uppercase tracking-[0.4em]">Carregando orchestrator…</p>
      </section>
    );
  }

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
            Planner → Diário → Calc → Trend → Coach → UI. Um circuito automatizado com validação clínica
            e glass-morphism inspirado no iOS 17.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Button onClick={handleDiarySync} disabled={syncing} className="gap-2 rounded-full px-6 py-5">
            <span aria-hidden>􀅈</span>
            {syncing ? "Sincronizando..." : "Registrar diário inteligente"}
          </Button>
          {success && <p className="text-xs text-emerald-500">{success}</p>}
        </div>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {ringData.map((ring) => (
          <RadialRing key={ring.label} {...ring} />
        ))}
      </div>

      {dashboard?.today && (
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
                  <li key={item} className="rounded-2xl border border-white/20 bg-white/80 px-3 py-2 shadow-inner dark:bg-white/10">
                    {item}
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
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weekData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" opacity={0.3} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(0)} kcal`} />
                    <Bar dataKey="calories" radius={[12, 12, 12, 12]}>
                      {weekData.map((entry, index) => (
                        <Cell key={`${entry.day}-${index}`} fill={statusColors[entry.status]} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="trend" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-200">
                {weekHighlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {navigationCards.length > 0 && (
          <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle>Navegação por nutriente</CardTitle>
              <CardDescription>Cards clicáveis levam às áreas dedicadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {navigationCards.map((link) => (
                <div
                  key={link.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/70 p-3 text-sm text-slate-700 shadow-inner dark:bg-white/10 dark:text-slate-100"
                >
                  <span className="text-2xl text-slate-500 dark:text-slate-100">{link.icon}</span>
                  <div>
                    <p className="font-semibold">{link.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{link.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {mealInsights.length > 0 && (
        <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle>Inspeção por refeição</CardTitle>
            <CardDescription>Impacto de cada refeição no dia e microajustes sugeridos.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {mealInsights.map((meal) => (
              <div key={`${meal.name}-${meal.time}`} className="rounded-3xl border border-white/20 bg-white/70 p-4 text-sm text-slate-700 shadow-inner dark:bg-white/10 dark:text-slate-100">
                <p className="text-base font-semibold text-slate-900 dark:text-white">{meal.name} — {meal.time}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {Math.round(meal.calories)} kcal · P {Math.round(meal.protein_g)} g · C {Math.round(meal.carbs_g)} g · G {Math.round(meal.fats_g)} g
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{meal.impact}</p>
                <p className="mt-1 text-xs italic text-slate-600 dark:text-slate-200">{meal.adjustment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
        <CardHeader className="gap-1">
          <CardTitle>Plano alimentar semanal</CardTitle>
          <CardDescription>
            {plan ? `${plan.days.length} dias ativos com foco ${plan.macro_targets.calories.toFixed(0)} kcal/dia.` : "Preparando plano"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {plan?.disclaimers.map((notice, index) => (
              <p key={`${notice}-${index}`} className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-3 text-xs text-amber-700 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100">
                {notice}
              </p>
            ))}
            {caloricProfile && (
              <div className="rounded-3xl border border-white/20 bg-white/60 p-4 text-sm text-slate-700 shadow-inner dark:bg-white/5 dark:text-slate-100">
                <p className="font-semibold">Metas energéticas</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-300">
                  <li>TMB: {caloricProfile.tmb.toFixed(0)} kcal</li>
                  <li>GET: {caloricProfile.get.toFixed(0)} kcal</li>
                  <li>Ajuste clínico: {caloricProfile.adjustment_kcal.toFixed(0)} kcal</li>
                  <li>Meta final: {caloricProfile.target_calories.toFixed(0)} kcal</li>
                </ul>
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-200">
              Macro-alvos: {plan?.macro_targets.protein_g ?? 0} g proteína · {plan?.macro_targets.carbs_g ?? 0} g carbo · {plan?.macro_targets.fats_g ?? 0} g gorduras.
            </p>
            <div className="rounded-3xl border border-white/20 bg-white/60 p-4 text-sm text-slate-700 shadow-inner dark:bg-white/5 dark:text-slate-100">
              <p className="font-semibold">Meal prep da semana</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-200">
                {plan?.meal_prep.slice(0, 4).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {plan?.hydration.reminders?.map((tip) => (
              <div
                key={tip}
                className="rounded-3xl border border-white/30 bg-gradient-to-br from-blue-500/30 to-cyan-400/30 p-4 text-sm text-white shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.4em]">H2O</p>
                <p className="text-base font-semibold">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {plan && (
        <Card className="border border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
          <CardHeader>
            <CardTitle>Resumo dos primeiros dias</CardTitle>
            <CardDescription>Plano completo inclui 7 dias com 5 refeições cada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {plan.days.slice(0, 2).map((day) => (
              <div key={day.day} className="rounded-3xl border border-white/30 bg-white/60 p-4 text-sm text-slate-700 shadow-inner dark:bg-white/5 dark:text-slate-100">
                <p className="text-base font-semibold">{day.day} · {Math.round(day.summary.calories)} kcal</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  P {Math.round(day.summary.protein_g)}g · C {Math.round(day.summary.carbs_g)}g · G {Math.round(day.summary.fats_g)}g · Hidratação alvo {Math.round(day.hydration_ml / 1000)}L
                </p>
                <ul className="mt-3 space-y-3">
                  {day.meals.map((meal) => (
                    <li
                      key={`${day.day}-${meal.label}-${meal.time}`}
                      className="rounded-2xl border border-white/40 bg-white/70 p-3 text-xs text-slate-600 shadow dark:bg-white/5 dark:text-slate-200"
                    >
                      <p className="font-semibold text-slate-800 dark:text-white">{meal.label} — {meal.time}</p>
                      <p className="mt-1 text-[11px]">{meal.items.join(" • ")}</p>
                      <p className="mt-1 text-[11px]">
                        Calorias {Math.round(meal.calories)} kcal | P {Math.round(meal.protein_g)}g | C {Math.round(meal.carbs_g)}g | G {Math.round(meal.fats_g)}g
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">Micros: {meal.micros.join(", ")}</p>
                      <p className="mt-1 text-[11px] italic text-slate-500 dark:text-slate-400">{meal.justification}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60 lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualizações multi-agente</CardTitle>
            <CardDescription>Radar, pizza, barras e timeline atualizados em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            {charts.map((chart) => (
              <div key={`${chart.type}-${chart.title}`} className="rounded-3xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
                <p className="text-sm font-medium text-slate-700 dark:text-white">{chart.title}</p>
                <ChartRenderer chart={chart} />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle>Coach-Agent</CardTitle>
              <CardDescription>Mensagens adaptativas e validação clínica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {coachMessages.map((message, index) => (
                <InsightCard
                  key={message.title + index}
                  title={message.title}
                  body={message.body}
                  severity={message.severity}
                  index={index}
                />
              ))}
            </CardContent>
          </Card>
          {alerts.length > 0 && (
            <Card className="border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
              <CardHeader>
                <CardTitle>Alertas inteligentes</CardTitle>
                <CardDescription>Proteína, fibras, sódio, hidratação e padrões comportamentais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <InsightCard
                    key={`${alert.title}-${index}`}
                    title={alert.title}
                    body={alert.detail}
                    severity={alert.severity}
                    index={index}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      {plan && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle>Lista de compras inteligente</CardTitle>
              <CardDescription>Organizada por categorias para facilitar a execução do meal prep.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-100">
              {plan.shopping_list.map((category) => (
                <div key={category.name} className="rounded-2xl border border-white/30 bg-white/60 p-3 shadow-inner dark:bg-white/5">
                  <p className="font-semibold">{category.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{category.items.join(", ")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle>Substituições, refeição livre e aderência</CardTitle>
              <CardDescription>Flexibilidade com segurança clínica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-500 dark:text-slate-300">
                    <tr>
                      <th className="py-1 text-left">Alimento</th>
                      <th className="py-1 text-left">Sub 1</th>
                      <th className="py-1 text-left">Sub 2</th>
                      <th className="py-1 text-left">Equivalência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.substitutions.map((sub) => (
                      <tr key={sub.item} className="border-t border-white/10">
                        <td className="py-1 pr-2 align-top">{sub.item}</td>
                        <td className="py-1 pr-2 align-top">{sub.substitution_1}</td>
                        <td className="py-1 pr-2 align-top">{sub.substitution_2}</td>
                        <td className="py-1 align-top">{sub.equivalence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/60 p-3 text-xs text-slate-600 shadow-inner dark:bg-white/5 dark:text-slate-200">
                <p className="font-semibold">Refeição livre</p>
                <p className="mt-1">{plan.free_meal}</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/60 p-3 text-xs text-slate-600 shadow-inner dark:bg-white/5 dark:text-slate-200">
                <p className="font-semibold">Dicas de aderência</p>
                <ul className="mt-1 space-y-1">
                  {plan.adherence_tips.map((tip) => (
                    <li key={tip}>• {tip}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/60 p-3 text-xs text-slate-600 shadow-inner dark:bg-white/5 dark:text-slate-200">
                <p className="font-semibold">Perguntas para refinar</p>
                <ul className="mt-1 space-y-1">
                  {plan.follow_up_questions.map((question) => (
                    <li key={question}>• {question}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.section>
  );
}

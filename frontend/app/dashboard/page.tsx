"use client";

import { useEffect, useMemo, useState } from "react";
import { RadialRing } from "@/components/dashboard/radial-ring";
import { WeeklyCaloriesChart } from "@/components/dashboard/weekly-calories-chart";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createMeal,
  fetchDailySummary,
  fetchInsights,
  fetchMeals,
  fetchWeeklySummary,
  MealResponse,
  DailySummaryResponse,
  WeeklySummaryResponse
} from "@/lib/api";

const ringModes = [
  { id: "core", label: "Calorias / Proteína / Hidratação" },
  { id: "macros", label: "Calorias / P / C / G" }
] as const;

type RingMode = (typeof ringModes)[number]["id"];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date) {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day; // semana inicia na segunda-feira
  clone.setDate(clone.getDate() + diff);
  return clone;
}

function formatWeekdayLabel(dateString: string) {
  return new Date(dateString)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

export default function DashboardPage() {
  const [ringMode, setRingMode] = useState<RingMode>("core");
  const [dailySummary, setDailySummary] = useState<DailySummaryResponse | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryResponse | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [meals, setMeals] = useState<MealResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const todayStr = formatDate(today);
        const weekStartStr = formatDate(getWeekStart(today));
        const [daily, weekly, insightData, mealsData] = await Promise.all([
          fetchDailySummary(todayStr),
          fetchWeeklySummary(weekStartStr),
          fetchInsights(),
          fetchMeals(todayStr)
        ]);
        setDailySummary(daily);
        setWeeklySummary(weekly);
        setInsights(insightData.insights);
        setMeals(mealsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const ringData = useMemo(() => {
    if (!dailySummary) {
      return [];
    }
    const base = {
      calories: dailySummary.totals.calories ?? 0,
      protein: dailySummary.totals.protein ?? 0,
      carbs: dailySummary.totals.carbs ?? 0,
      fat: dailySummary.totals.fat ?? 0,
      hydration: dailySummary.totals.hydration ?? 0
    };
    const goal = dailySummary.goal;

    if (ringMode === "core") {
      return [
        { label: "Calorias", value: base.calories, goal: goal?.calories_target, unit: "kcal", color: "#0a84ff" },
        { label: "Proteína", value: base.protein, goal: goal?.protein_target, unit: "g", color: "#34d399" },
        { label: "Hidratação", value: base.hydration, goal: goal?.hydration_target, unit: "L", color: "#14b8a6" }
      ];
    }
    return [
      { label: "Calorias", value: base.calories, goal: goal?.calories_target, unit: "kcal", color: "#0a84ff" },
      { label: "Proteínas", value: base.protein, goal: goal?.protein_target, unit: "g", color: "#34d399" },
      { label: "Carboidratos", value: base.carbs, goal: goal?.carbs_target, unit: "g", color: "#f97316" },
      { label: "Gorduras", value: base.fat, goal: goal?.fat_target, unit: "g", color: "#facc15" }
    ];
  }, [dailySummary, ringMode]);

  const weeklyChartData = useMemo(() => {
    if (!weeklySummary) return [];
    return weeklySummary.days.map((day) => ({
      label: formatWeekdayLabel(day.date),
      calories: day.calories,
      goal: weeklySummary.goal?.calories_target ?? undefined
    }));
  }, [weeklySummary]);

  const quickLog = async () => {
    try {
      setError(null);
      await createMeal({
        meal_time: new Date().toISOString(),
        text: "Shake de recuperação com whey, banana e aveia",
        meal_type: "lanche"
      });
      const today = new Date();
      const todayStr = formatDate(today);
      const weekStartStr = formatDate(getWeekStart(today));
      const [daily, weekly, mealsData, insightData] = await Promise.all([
        fetchDailySummary(todayStr),
        fetchWeeklySummary(weekStartStr),
        fetchMeals(todayStr),
        fetchInsights()
      ]);
      setDailySummary(daily);
      setWeeklySummary(weekly);
      setMeals(mealsData);
      setInsights(insightData.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no registro rápido");
    }
  };

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Painel avançado</p>
          <h1 className="text-4xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-base text-slate-600">
            Visualize métricas diárias, evolução semanal e recomendações inteligentes.
          </p>
        </div>
        <Button variant="secondary" onClick={quickLog}>
          Registrar shake rápido
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Anéis de progresso</CardTitle>
            <CardDescription>Alterne entre visão fundamental e macros completas.</CardDescription>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            {ringModes.map((mode) => (
              <Button
                key={mode.id}
                variant={ringMode === mode.id ? "secondary" : "ghost"}
                onClick={() => setRingMode(mode.id)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading && !dailySummary ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : (
            ringData.map((ring) => (
              <RadialRing key={ring.label} {...ring} />
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Calorias na semana</CardTitle>
              <CardDescription>Comparativo entre consumo real e meta diária.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading && !weeklySummary ? (
              <p className="text-sm text-slate-500">Carregando gráfico...</p>
            ) : (
              <WeeklyCaloriesChart data={weeklyChartData} goal={weeklySummary?.goal?.calories_target ?? undefined} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Insights</CardTitle>
              <CardDescription>Coaching rápido baseado no seu histórico.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-slate-500">Registre refeições para liberar recomendações.</p>
            ) : (
              insights.map((message, index) => <InsightCard key={`${message}-${index}`} message={message} />)
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Refeições do dia</CardTitle>
            <CardDescription>Lista cronológica das entradas registradas.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading && meals.length === 0 ? (
            <p className="text-sm text-slate-500">Carregando refeições...</p>
          ) : meals.length === 0 ? (
            <p className="text-sm text-slate-500">Ainda não há refeições cadastradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {meals.map((meal) => (
                <li key={meal.id} className="flex items-center justify-between py-3 text-sm text-slate-700">
                  <div>
                    <p className="font-medium text-slate-900">{meal.raw_input || "Descrição não informada"}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(meal.meal_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{meal.calories ? `${Math.round(meal.calories)} kcal` : "-"}</p>
                    <p>{meal.protein ? `${Math.round(meal.protein)} g proteína` : "-"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

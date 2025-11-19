"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMeal } from "@/lib/api";

function formatTime(date: Date) {
  return date.toISOString().slice(0, 16);
}

export default function TodayMealPage() {
  const defaultDate = useMemo(() => formatTime(new Date()), []);
  const [form, setForm] = useState({ description: "", meal_time: defaultDate });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await createMeal({
        meal_time: new Date(form.meal_time).toISOString(),
        text: form.description,
        meal_type: "registro"
      });
      setStatus("Refeição registrada!");
      setForm((prev) => ({ ...prev, description: "" }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Hoje</p>
        <h1 className="text-4xl font-semibold text-slate-900">Registro rápido</h1>
        <p className="mt-2 text-base text-slate-600">Transforme descrições livres em dados estruturados quando o NLP estiver ativo.</p>
      </div>

      <Card>
        <CardHeader className="flex-col items-start gap-2">
          <CardTitle>Novo registro</CardTitle>
          <CardDescription>Descreva o que consumiu e indique o horário.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="meal_description">Descrição</Label>
            <Textarea
              id="meal_description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Ex: Omelete com 2 ovos, queijo minas e café preto"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal_time">Horário</Label>
            <Input
              id="meal_time"
              type="datetime-local"
              value={form.meal_time}
              onChange={(event) => setForm((prev) => ({ ...prev, meal_time: event.target.value }))}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrar refeição"}
          </Button>
          {status && <p className="text-sm text-slate-500">{status}</p>}
        </form>
      </Card>
    </section>
  );
}

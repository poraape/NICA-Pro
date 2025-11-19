"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUser, upsertGoals } from "@/lib/api";

const activityLevels = [
  { value: "sedentary", label: "Sedentário" },
  { value: "light", label: "Leve" },
  { value: "moderate", label: "Moderado" },
  { value: "intense", label: "Intenso" }
];

const goals = [
  { value: "lose", label: "Emagrecer" },
  { value: "maintain", label: "Manter" },
  { value: "gain", label: "Ganhar massa" }
];

export default function OnboardingPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    goal: "maintain",
    activity_level: "moderate",
    calories_target: "2000",
    protein_target: "120"
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await createUser({
        email: form.email,
        full_name: form.full_name,
        metadata: {
          age: Number(form.age),
          gender: form.gender,
          weight: Number(form.weight),
          height: Number(form.height),
          goal: form.goal,
          activity_level: form.activity_level
        }
      });
      await upsertGoals({
        calories_target: Number(form.calories_target),
        protein_target: Number(form.protein_target),
        effective_from: new Date().toISOString().split("T")[0]
      });
      setStatus("Perfil salvo com sucesso!");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha ao salvar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Onboarding</p>
        <h1 className="text-4xl font-semibold text-slate-900">Seu perfil nutricional</h1>
        <p className="mt-2 text-base text-slate-600">
          Capture dados essenciais para calibrar metas diárias e desbloquear recomendações mais precisas.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-col items-start gap-2">
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>Usamos seus dados apenas para personalizar metas.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                min={10}
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione
                </option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={form.height}
                onChange={(e) => updateField("height", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo</Label>
              <Select id="goal" value={form.goal} onChange={(e) => updateField("goal", e.target.value)}>
                {goals.map((goal) => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity_level">Atividade</Label>
              <Select
                id="activity_level"
                value={form.activity_level}
                onChange={(e) => updateField("activity_level", e.target.value)}
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein_target">Meta de proteína (g)</Label>
              <Input
                id="protein_target"
                type="number"
                value={form.protein_target}
                onChange={(e) => updateField("protein_target", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories_target">Meta calórica diária</Label>
            <Input
              id="calories_target"
              type="number"
              value={form.calories_target}
              onChange={(e) => updateField("calories_target", e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar perfil"}
            </Button>
            {status && <p className="text-sm text-slate-500">{status}</p>}
          </div>
        </form>
      </Card>
    </section>
  );
}

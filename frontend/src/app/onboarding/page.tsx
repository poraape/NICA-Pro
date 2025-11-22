"use client";

import { useEffect, useState } from "react";
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

type FormState = {
  full_name: string;
  email: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  goal: string;
  activity_level: string;
  calories_target: string;
  protein_target: string;
};

type ParsedForm = {
  full_name: string;
  email: string;
  age: number;
  gender: "female" | "male" | "other";
  weight: number;
  height: number;
  goal: "lose" | "maintain" | "gain";
  activity_level: "sedentary" | "light" | "moderate" | "intense";
  calories_target: number;
  protein_target: number;
};

const validateForm = (form: FormState): { errors: Record<string, string>; data?: ParsedForm } => {
  const errors: Record<string, string> = {};

  const numeric = (value: string, field: string): number | null => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      errors[field] = "Use apenas números";
      return null;
    }
    return parsed;
  };

  const fullName = form.full_name.trim();
  if (fullName.length < 3) errors.full_name = "Informe seu nome completo";

  const emailPattern = /.+@.+\..+/;
  if (!emailPattern.test(form.email)) errors.email = "E-mail inválido";

  const age = numeric(form.age, "age");
  if (age !== null && (age < 10 || age > 120)) {
    errors.age = "Idade entre 10 e 120";
  }

  if (!form.gender) errors.gender = "Selecione seu gênero";

  const weight = numeric(form.weight, "weight");
  if (weight !== null && (weight < 20 || weight > 500)) {
    errors.weight = "Peso deve ficar entre 20kg e 500kg";
  }

  const height = numeric(form.height, "height");
  if (height !== null && (height < 50 || height > 250)) {
    errors.height = "Altura deve ficar entre 50cm e 250cm";
  }

  const calories = numeric(form.calories_target, "calories_target");
  if (calories !== null && (calories < 800 || calories > 6000)) {
    errors.calories_target = "Calorias entre 800 e 6000";
  }

  const protein = numeric(form.protein_target, "protein_target");
  if (protein !== null && (protein < 20 || protein > 400)) {
    errors.protein_target = "Proteína entre 20g e 400g";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    data: {
      full_name: fullName,
      email: form.email,
      age: age ?? 0,
      gender: form.gender as ParsedForm["gender"],
      weight: weight ?? 0,
      height: height ?? 0,
      goal: form.goal as ParsedForm["goal"],
      activity_level: form.activity_level as ParsedForm["activity_level"],
      calories_target: calories ?? 0,
      protein_target: protein ?? 0
    }
  };
};

export default function OnboardingPage() {
  const [form, setForm] = useState<FormState>({
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const first = Object.keys(errors)[0];
    const target = document.getElementById(first);
    target?.focus();
  }, [errors]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(form);
    if (validation.errors && Object.keys(validation.errors).length > 0) {
      setErrors(validation.errors);
      setStatus("Por favor, corrija os campos destacados.");
      return;
    }

    setErrors({});
    setLoading(true);
    setStatus(null);
    const payload = validation.data!;
    try {
      await createUser({
        email: payload.email,
        full_name: payload.full_name,
        metadata: {
          age: payload.age,
          gender: payload.gender,
          weight: payload.weight,
          height: payload.height,
          goal: payload.goal,
          activity_level: payload.activity_level
        }
      });
      await upsertGoals({
        calories_target: payload.calories_target,
        protein_target: payload.protein_target,
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
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={errors.full_name ? "full_name-error" : undefined}
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                required
              />
              {errors.full_name && (
                <p id="full_name-error" role="alert" className="text-sm text-red-600">
                  {errors.full_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                min={10}
                aria-invalid={Boolean(errors.age)}
                aria-describedby={errors.age ? "age-error" : undefined}
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                required
              />
              {errors.age && (
                <p id="age-error" role="alert" className="text-sm text-red-600">
                  {errors.age}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                id="gender"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                required
                aria-invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? "gender-error" : undefined}
              >
                <option value="" disabled>
                  Selecione
                </option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
              </Select>
              {errors.gender && (
                <p id="gender-error" role="alert" className="text-sm text-red-600">
                  {errors.gender}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                aria-invalid={Boolean(errors.weight)}
                aria-describedby={errors.weight ? "weight-error" : undefined}
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                required
              />
              {errors.weight && (
                <p id="weight-error" role="alert" className="text-sm text-red-600">
                  {errors.weight}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                aria-invalid={Boolean(errors.height)}
                aria-describedby={errors.height ? "height-error" : undefined}
                value={form.height}
                onChange={(e) => updateField("height", e.target.value)}
                required
              />
              {errors.height && (
                <p id="height-error" role="alert" className="text-sm text-red-600">
                  {errors.height}
                </p>
              )}
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
                aria-invalid={Boolean(errors.activity_level)}
                aria-describedby={errors.activity_level ? "activity_level-error" : undefined}
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
              {errors.activity_level && (
                <p id="activity_level-error" role="alert" className="text-sm text-red-600">
                  {errors.activity_level}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein_target">Meta de proteína (g)</Label>
              <Input
                id="protein_target"
                type="number"
                aria-invalid={Boolean(errors.protein_target)}
                aria-describedby={errors.protein_target ? "protein_target-error" : undefined}
                value={form.protein_target}
                onChange={(e) => updateField("protein_target", e.target.value)}
              />
              {errors.protein_target && (
                <p id="protein_target-error" role="alert" className="text-sm text-red-600">
                  {errors.protein_target}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories_target">Meta calórica diária</Label>
            <Input
              id="calories_target"
              type="number"
              aria-invalid={Boolean(errors.calories_target)}
              aria-describedby={errors.calories_target ? "calories_target-error" : undefined}
              value={form.calories_target}
              onChange={(e) => updateField("calories_target", e.target.value)}
              required
            />
            {errors.calories_target && (
              <p id="calories_target-error" role="alert" className="text-sm text-red-600">
                {errors.calories_target}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar perfil"}
            </Button>
            {status && (
              <p className="text-sm text-slate-500" role="status" aria-live="polite">
                {status}
              </p>
            )}
          </div>
        </form>
      </Card>
    </section>
  );
}

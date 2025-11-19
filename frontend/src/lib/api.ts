const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Erro ao comunicar com a API");
  }
  return response.json() as Promise<T>;
}

const jsonHeaders = { "Content-Type": "application/json" };

export interface ProfilePayload {
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  sex: "male" | "female" | "other";
  activity_level: "sedentary" | "light" | "moderate" | "intense";
  goal: "cut" | "maintain" | "bulk";
}

export interface DiaryPayload {
  user: string;
  entries: string[];
}

export interface NutritionPlanResponse {
  plan: {
    user: string;
    disclaimers: string[];
    caloric_profile: {
      tmb: number;
      get: number;
      adjustment_kcal: number;
      target_calories: number;
    };
    days: Array<{
      day: string;
      hydration_ml: number;
      summary: { calories: number; protein_g: number; carbs_g: number; fats_g: number };
      meals: Array<{
        label: string;
        time: string;
        items: string[];
        calories: number;
        protein_g: number;
        carbs_g: number;
        fats_g: number;
        micros: string[];
        justification: string;
      }>;
    }>;
    macro_targets: { calories: number; protein_g: number; carbs_g: number; fats_g: number };
    micro_targets: {
      fiber_g: number;
      omega3_mg: number;
      iron_mg: number;
      calcium_mg: number;
      sodium_mg: number;
    };
    hydration: { total_liters: number; reminders: string[] };
    shopping_list: Array<{ name: string; items: string[] }>;
    meal_prep: string[];
    substitutions: Array<{ item: string; substitution_1: string; substitution_2: string; equivalence: string }>;
    free_meal: string;
    adherence_tips: string[];
    follow_up_questions: string[];
  };
}

export interface DiaryResponse {
  log: {
    user: string;
    date: string;
    meals: Array<{ description: string; items: Array<{ label: string; quantity: number; unit: string }> }>;
  };
}

export interface DashboardCard {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

export interface DashboardChart {
  type: "radar" | "pie" | "bar" | "timeline";
  title: string;
  data: Record<string, unknown>;
}

export interface CoachingMessage {
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "critical";
}

export interface ProgressMetric {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: string;
}

export interface TodayOverview {
  metrics: ProgressMetric[];
  micronutrients: string[];
  hydration: ProgressMetric;
  insights: string[];
}

export interface WeeklyDayStat {
  day: string;
  calories: number;
  status: "above" | "target" | "below";
}

export interface WeekSection {
  bars: WeeklyDayStat[];
  trend_line: number[];
  highlights: string[];
}

export interface MealInspection {
  name: string;
  time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  impact: string;
  adjustment: string;
}

export interface DashboardAlert {
  title: string;
  detail: string;
  severity: "info" | "success" | "warning" | "critical";
}

export interface NavigationLink {
  label: string;
  description: string;
  icon: string;
  href: string;
}

export interface DashboardResponse {
  dashboard: {
    user: string;
    cards: DashboardCard[];
    charts: DashboardChart[];
    coach_messages: CoachingMessage[];
    today: TodayOverview;
    week: WeekSection;
    meal_insights: MealInspection[];
    alerts: DashboardAlert[];
    navigation: NavigationLink[];
    last_updated: string;
  };
}

export function upsertPlan(payload: ProfilePayload) {
  return fetch(`${API_BASE}/api/v1/plan`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<NutritionPlanResponse>(res));
}

export function syncDiary(payload: DiaryPayload) {
  return fetch(`${API_BASE}/api/v1/diary`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<DiaryResponse>(res));
}

export function fetchDashboard(user: string) {
  return fetch(`${API_BASE}/api/v1/dashboard/${user}`).then((res) => handleResponse<DashboardResponse>(res));
}

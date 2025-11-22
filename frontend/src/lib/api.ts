const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AUTH_TOKEN_ENV = process.env.NEXT_PUBLIC_API_TOKEN;
const AUTH_STORAGE_KEY = "nica-pro-auth-token";

export interface ApiMeta {
  trace_id: string;
  actor?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
  message?: string | null;
}

function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) return stored;
  }
  return AUTH_TOKEN_ENV ?? null;
}

export function persistAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, token);
}

function authHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    let detail = "Erro ao comunicar com a API";
    try {
      const body = await response.json();
      detail = (body as { detail?: string; error?: string }).detail ?? (body as { error?: string }).error ?? detail;
    } catch (error) {
      const fallback = await response.text();
      if (fallback) detail = fallback;
    }

    if (response.status === 401) {
      throw new Error(`Sessão expirada ou inválida: ${detail}`);
    }
    if (response.status === 403) {
      throw new Error(`Acesso negado: ${detail}`);
    }
    throw new Error(detail);
  }
  const payload = (await response.json()) as Partial<ApiResponse<T>> & {
    detail?: string;
    error?: string;
  };

  if (payload && "data" in payload && "meta" in payload && payload.data !== undefined) {
    return payload as ApiResponse<T>;
  }

  const trace = (payload as { trace_id?: string }).trace_id ?? response.headers.get("x-trace-id") ?? "";
  return {
    data: payload as T,
    meta: { trace_id: trace },
    message: (payload as { message?: string }).message,
  };
}

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

export interface NutritionPlanPayload {
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

export interface DiaryPayload {
  user: string;
  entries: string[];
}

export interface DiaryResult {
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

export interface DashboardPayload {
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

export type NutritionPlanResponse = ApiResponse<NutritionPlanPayload>;
export type DiaryResponse = ApiResponse<DiaryResult>;
export type DashboardResponse = ApiResponse<DashboardPayload>;

export function upsertPlan(payload: ProfilePayload) {
  return fetch(`${API_BASE}/api/v1/plan`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<NutritionPlanPayload>(res));
}

export function syncDiary(payload: DiaryPayload) {
  return fetch(`${API_BASE}/api/v1/diary`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<DiaryResult>(res));
}

export function fetchDashboard(user: string) {
  return fetch(`${API_BASE}/api/v1/dashboard/${user}`, { headers: authHeaders() }).then((res) =>
    handleResponse<DashboardPayload>(res)
  );
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  metadata?: Record<string, unknown>;
}

export function createUser(payload: CreateUserPayload) {
  return fetch(`${API_BASE}/api/v1/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<{ id: string }>(res));
}

export interface UpsertGoalsPayload {
  calories_target: number;
  protein_target: number;
  effective_from: string;
}

export function upsertGoals(payload: UpsertGoalsPayload) {
  return fetch(`${API_BASE}/api/v1/goals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<{ ok: boolean }>(res));
}

export interface CreateMealPayload {
  meal_time: string;
  text: string;
  meal_type: string;
}

export function createMeal(payload: CreateMealPayload) {
  return fetch(`${API_BASE}/api/v1/meals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  }).then((res) => handleResponse<{ id: string }>(res));
}

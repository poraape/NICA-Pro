const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Erro ao comunicar com a API");
  }
  return response.json() as Promise<T>;
}

const jsonHeaders = { "Content-Type": "application/json" };

export interface GoalSnapshot {
  calories_target?: number | null;
  protein_target?: number | null;
  carbs_target?: number | null;
  fat_target?: number | null;
  hydration_target?: number | null;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydration: number;
}

export interface DailySummaryResponse {
  date: string;
  totals: MacroTotals;
  goal?: GoalSnapshot | null;
}

export interface WeeklyDayBreakdown {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeeklySummaryResponse {
  week_start: string;
  days: WeeklyDayBreakdown[];
  goal?: GoalSnapshot | null;
}

export interface InsightsResponse {
  insights: string[];
}

export interface MealPayload {
  meal_time: string;
  text: string;
  meal_type?: string;
  emotion?: string;
  plan_id?: string;
}

export interface MealResponse {
  id: string;
  meal_time: string;
  raw_input: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export async function createUser(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function upsertGoals(payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/goals`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function fetchGoals() {
  const response = await fetch(`${API_BASE}/api/goals`);
  return handleResponse(response);
}

export async function createMeal(payload: MealPayload) {
  const response = await fetch(`${API_BASE}/api/meals`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function fetchMeals(date: string): Promise<MealResponse[]> {
  const response = await fetch(`${API_BASE}/api/meals?date=${date}`);
  return handleResponse(response);
}

export async function fetchDailySummary(date: string): Promise<DailySummaryResponse> {
  const response = await fetch(`${API_BASE}/api/summary/daily?date=${date}`);
  return handleResponse(response);
}

export async function fetchWeeklySummary(weekStart: string): Promise<WeeklySummaryResponse> {
  const response = await fetch(`${API_BASE}/api/summary/weekly?week_start=${weekStart}`);
  return handleResponse(response);
}

export async function fetchInsights(): Promise<InsightsResponse> {
  const response = await fetch(`${API_BASE}/api/summary/insights`);
  return handleResponse(response);
}

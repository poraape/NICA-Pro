"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchDashboard,
  syncDiary as syncDiaryApi,
  upsertPlan,
  type DashboardResponse,
  type DiaryPayload,
  type NutritionPlanResponse,
  type ProfilePayload
} from "./api";

export type ThemeMode = "system" | "light" | "dark";

interface DiaryDraft {
  entries: string[];
  draftText: string;
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "warning" | "error" | "info";
}

interface AppState {
  profile: ProfilePayload;
  diary: DiaryDraft;
  dashboard: DashboardResponse["dashboard"] | null;
  plan: NutritionPlanResponse["plan"] | null;
  loading: boolean;
  syncing: boolean;
  theme: ThemeMode;
  toasts: ToastMessage[];
}

interface AppContextValue extends AppState {
  updateProfile: (partial: Partial<ProfilePayload>) => void;
  updateDiaryDraft: (text: string) => void;
  addDiaryEntry: (entry: string) => void;
  removeDiaryEntry: (index: number) => void;
  setTheme: (mode: ThemeMode) => void;
  refreshDashboard: () => Promise<void>;
  syncDiary: () => Promise<void>;
  pushToast: (toast: Omit<ToastMessage, "id">) => void;
  hydrateFromStorage: () => void;
}

const defaultProfile: ProfilePayload = {
  name: "", // required by API
  age: 30,
  weight_kg: 70,
  height_cm: 170,
  sex: "female",
  activity_level: "moderate",
  goal: "maintain"
};

const defaultDiary: DiaryDraft = {
  entries: [],
  draftText: ""
};

const STORAGE_KEY = "nica-pro-state";

const AppStateContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    profile: defaultProfile,
    diary: defaultDiary,
    dashboard: null,
    plan: null,
    loading: false,
    syncing: false,
    theme: "system",
    toasts: []
  });

  const applyThemeClass = (mode: ThemeMode) => {
    if (typeof window === "undefined") return;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = mode === "dark" || (mode === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", shouldDark);
    document.documentElement.style.setProperty("color-scheme", shouldDark ? "dark" : "light");
  };

  const persistState = (next: AppState) => {
    if (typeof window === "undefined") return;
    const { dashboard, plan, ...rest } = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  };

  const hydrateFromStorage = () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      setState((prev) => ({ ...prev, ...parsed, dashboard: prev.dashboard, plan: prev.plan }));
      applyThemeClass((parsed as AppState).theme ?? "system");
    } catch (error) {
      console.error("Failed to hydrate state", error);
    }
  };

  useEffect(() => {
    hydrateFromStorage();
    if (typeof window !== "undefined") {
      applyThemeClass(state.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = (partial: Partial<ProfilePayload>) => {
    setState((prev) => {
      const next = { ...prev, profile: { ...prev.profile, ...partial } };
      persistState(next);
      return next;
    });
  };

  const updateDiaryDraft = (draftText: string) => {
    setState((prev) => {
      const next = { ...prev, diary: { ...prev.diary, draftText } };
      persistState(next);
      return next;
    });
  };

  const addDiaryEntry = (entry: string) => {
    if (!entry.trim()) return;
    setState((prev) => {
      const nextEntries = [...prev.diary.entries, entry.trim()];
      const next = { ...prev, diary: { ...prev.diary, entries: nextEntries, draftText: "" } };
      persistState(next);
      return next;
    });
  };

  const removeDiaryEntry = (index: number) => {
    setState((prev) => {
      const nextEntries = prev.diary.entries.filter((_, i) => i !== index);
      const next = { ...prev, diary: { ...prev.diary, entries: nextEntries } };
      persistState(next);
      return next;
    });
  };

  const pushToast = (toast: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID();
    setState((prev) => ({ ...prev, toasts: [...prev.toasts, { ...toast, id }] }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, toasts: prev.toasts.filter((item) => item.id !== id) }));
    }, 4200);
  };

  const refreshDashboard = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const planResponse = await upsertPlan(state.profile);
      const dashboardResponse = await fetchDashboard(state.profile.name);
      setState((prev) => ({
        ...prev,
        plan: planResponse.plan,
        dashboard: dashboardResponse.dashboard,
        loading: false
      }));
      pushToast({ title: "Plano recalibrado", description: "Dados combinados com a última versão do dashboard.", tone: "success" });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      pushToast({
        title: "Não foi possível atualizar",
        description: error instanceof Error ? error.message : "Falha ao carregar dashboard",
        tone: "error"
      });
    }
  };

  const syncDiary = async () => {
    if (!state.profile.name) {
      pushToast({ title: "Defina um usuário", description: "Informe um nome antes de sincronizar o diário.", tone: "warning" });
      return;
    }
    const payload: DiaryPayload = { user: state.profile.name, entries: state.diary.entries };
    setState((prev) => ({ ...prev, syncing: true }));
    try {
      await syncDiaryApi(payload);
      await refreshDashboard();
      setState((prev) => ({ ...prev, diary: { ...prev.diary, entries: [] }, syncing: false }));
      pushToast({ title: "Diário sincronizado", description: `${payload.entries.length} entrada(s) enviada(s).`, tone: "success" });
    } catch (error) {
      setState((prev) => ({ ...prev, syncing: false }));
      pushToast({
        title: "Erro ao sincronizar diário",
        description: error instanceof Error ? error.message : "Tente novamente em instantes",
        tone: "error"
      });
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setState((prev) => {
      const next = { ...prev, theme: mode };
      persistState(next);
      applyThemeClass(mode);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      ...state,
      updateProfile,
      updateDiaryDraft,
      addDiaryEntry,
      removeDiaryEntry,
      setTheme,
      refreshDashboard,
      syncDiary,
      pushToast,
      hydrateFromStorage
    }),
    [state]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}

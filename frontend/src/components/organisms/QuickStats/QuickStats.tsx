import React from "react";

import { NutriIcon } from "@/components/atoms/NutriIcon";
import { MacroBar, MealChecklist, NutriCard, NutriProgressRing, HydrationGlass } from "@/components/molecules";

import "./QuickStats.styles.css";

export interface QuickStatsData {
  calories: {
    consumed: number;
    target: number;
    remaining: number;
  };
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  hydration: {
    current: number;
    target: number;
  };
  meals: {
    completed: number;
    total: number;
  };
}

export interface QuickStatsProps {
  data?: QuickStatsData;
  isLoading?: boolean;
  onCaloriesClick?: () => void;
  onMacrosClick?: () => void;
  onHydrationClick?: () => void;
  onMealsClick?: () => void;
}

const getCalorieStatus = (percentage: number) => {
  if (percentage > 110) return "exceeded" as const;
  if (percentage >= 90) return "near-limit" as const;
  if (percentage >= 60) return "on-track" as const;
  return "neutral" as const;
};

export const QuickStats: React.FC<QuickStatsProps> = ({
  data,
  isLoading = false,
  onCaloriesClick,
  onMacrosClick,
  onHydrationClick,
  onMealsClick,
}) => {
  const hasData = Boolean(data);

  const calorieProgress = hasData && data ? (data.calories.target ? (data.calories.consumed / data.calories.target) * 100 : 0) : 0;
  const hydrationProgress = hasData && data ? (data.hydration.target ? (data.hydration.current / data.hydration.target) * 100 : 0) : 0;
  const mealProgress = hasData && data && data.meals.total > 0 ? (data.meals.completed / data.meals.total) * 100 : 0;

  if (!isLoading && !hasData) {
    return (
      <section className="quick-stats quick-stats--empty" aria-label="Resumo diário">
        <NutriCard className="quick-stats__empty-card" ariaLabel="Sem dados disponíveis">
          <div className="quick-stats__empty-content">
            <div>
              <p className="quick-stats__empty-title">Registre sua primeira refeição</p>
              <p className="quick-stats__empty-subtitle">
                Adicione alimentos para acompanhar calorias, macros e hidratação em tempo real.
              </p>
            </div>
            <NutriIcon name="plus.circle" size="large" aria-hidden />
          </div>
        </NutriCard>
      </section>
    );
  }

  return (
    <section className="quick-stats" aria-label="Resumo diário">
      <NutriCard
        status={getCalorieStatus(calorieProgress)}
        className="quick-stats__card"
        onClick={onCaloriesClick}
        ariaLabel="Resumo de calorias"
      >
        <div className="quick-stats__header">
          <span className="quick-stats__title">Calorias</span>
          <button
            className="quick-stats__cta"
            aria-label="Ver detalhes de calorias"
            onClick={(event) => {
              event.stopPropagation();
              onCaloriesClick?.();
            }}
          >
            <NutriIcon name="arrow.right.circle" aria-hidden />
          </button>
        </div>

        <div className="quick-stats__body">
          {isLoading ? (
            <div className="quick-stats__skeleton quick-stats__skeleton--ring" aria-hidden />
          ) : (
            <NutriProgressRing
              value={Math.min(Math.max(calorieProgress, 0), 140)}
              size="large"
              color="primary"
              showLabel
              aria-label={`Progresso de calorias: ${Math.round(calorieProgress)}% da meta`}
            />
          )}

          <div className="quick-stats__metric">
            <p className="quick-stats__metric-title">Restam para hoje</p>
            {isLoading ? (
              <div className="quick-stats__skeleton quick-stats__skeleton--text" />
            ) : (
              <p className="quick-stats__metric-primary">
                <span className="value">{data?.calories.remaining ?? "--"}</span>
                <span className="unit">kcal</span>
              </p>
            )}
          </div>
        </div>
      </NutriCard>

      <NutriCard
        status="on-track"
        className="quick-stats__card"
        onClick={onMacrosClick}
        ariaLabel="Resumo de macronutrientes"
      >
        <div className="quick-stats__header">
          <span className="quick-stats__title">Macros</span>
          <button
            className="quick-stats__cta"
            aria-label="Ajustar metas de macros"
            onClick={(event) => {
              event.stopPropagation();
              onMacrosClick?.();
            }}
          >
            <NutriIcon name="slider.horizontal.3" aria-hidden />
          </button>
        </div>

        <div className="quick-stats__body quick-stats__body--stacked">
          {isLoading ? (
            <div className="quick-stats__skeleton quick-stats__skeleton--bar" aria-hidden />
          ) : (
            <MacroBar
              protein={data?.macros.protein ?? 0}
              carbs={data?.macros.carbs ?? 0}
              fat={data?.macros.fat ?? 0}
              size="medium"
              ariaLabel={`Distribuição de macros: proteína ${data?.macros.protein ?? 0}g, carboidratos ${
                data?.macros.carbs ?? 0
              }g, gordura ${data?.macros.fat ?? 0}g`}
            />
          )}

          {!isLoading && (
            <div className="quick-stats__macro-values" aria-hidden>
              <span>Prot {data?.macros.protein ?? 0}g</span>
              <span>Carb {data?.macros.carbs ?? 0}g</span>
              <span>Gord {data?.macros.fat ?? 0}g</span>
            </div>
          )}
        </div>
      </NutriCard>

      <NutriCard
        status={hydrationProgress >= 100 ? "on-track" : "neutral"}
        className="quick-stats__card"
        onClick={onHydrationClick}
        ariaLabel="Resumo de hidratação"
      >
        <div className="quick-stats__header">
          <span className="quick-stats__title">Hidratação</span>
          <button
            className="quick-stats__cta"
            aria-label="Ajustar meta de hidratação"
            onClick={(event) => {
              event.stopPropagation();
              onHydrationClick?.();
            }}
          >
            <NutriIcon name="drop.fill" aria-hidden />
          </button>
        </div>

        <div className="quick-stats__body quick-stats__body--center">
          {isLoading ? (
            <div className="quick-stats__skeleton quick-stats__skeleton--glass" aria-hidden />
          ) : (
            <HydrationGlass
              current={data?.hydration.current ?? 0}
              target={data?.hydration.target ?? 0}
              unit="L"
              ariaLabel={`Progresso de hidratação: ${Math.round(hydrationProgress)}% da meta`}
            />
          )}
          {!isLoading && (
            <p className="quick-stats__metric-secondary" aria-hidden>
              {data?.hydration.current ?? 0} / {data?.hydration.target ?? 0} L
            </p>
          )}
        </div>
      </NutriCard>

      <NutriCard
        status={mealProgress >= 100 ? "on-track" : "neutral"}
        className="quick-stats__card"
        onClick={onMealsClick}
        ariaLabel="Resumo de refeições"
      >
        <div className="quick-stats__header">
          <span className="quick-stats__title">Refeições</span>
          <button
            className="quick-stats__cta"
            aria-label="Ver checklist de refeições"
            onClick={(event) => {
              event.stopPropagation();
              onMealsClick?.();
            }}
          >
            <NutriIcon name="checklist" aria-hidden />
          </button>
        </div>

        <div className="quick-stats__body quick-stats__body--stacked">
          {isLoading ? (
            <div className="quick-stats__skeleton quick-stats__skeleton--dots" aria-hidden />
          ) : (
            <MealChecklist
              completed={data?.meals.completed ?? 0}
              total={data?.meals.total ?? 0}
              ariaLabel={`Refeições concluídas: ${data?.meals.completed ?? 0} de ${data?.meals.total ?? 0}`}
            />
          )}
          {!isLoading && (
            <p className="quick-stats__metric-secondary" aria-hidden>
              {data?.meals.completed ?? 0} de {data?.meals.total ?? 0}
            </p>
          )}
        </div>
      </NutriCard>
    </section>
  );
};

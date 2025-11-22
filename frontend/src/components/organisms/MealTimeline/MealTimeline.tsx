import React, { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, isToday, isYesterday, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { NutriButton, NutriIcon } from "@/components/atoms";
import { FoodItem, MacroBar } from "@/components/molecules";
import { hapticFeedback } from "@/utils/haptic";
import { useAnnouncement } from "@/hooks/useAnnouncement";
import { useSwipeable } from "@/hooks/useSwipeable";

import { FoodSearchSheet } from "../FoodSearchSheet/FoodSearchSheet";

import "./MealTimeline.styles.css";

export interface MealData {
  id: string;
  type: "breakfast" | "morning-snack" | "lunch" | "afternoon-snack" | "dinner" | "evening-snack";
  time: string;
  foods: FoodItemData[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  status: "completed" | "pending" | "late" | "in-progress";
}

export interface FoodItemData {
  id: string;
  name: string;
  portion: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl?: string;
  notes?: string;
}

export interface MealTimelineProps {
  initialDate?: Date;
  meals: MealData[];
  onDateChange?: (date: Date) => void;
  onAddFood?: (mealId: string, food: FoodItemData) => void;
  onEditFood?: (mealId: string, foodId: string, updates: Partial<FoodItemData>) => void;
  onDeleteFood?: (mealId: string, foodId: string) => void;
  onDuplicateMeal?: (mealId: string) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  offline?: boolean;
}

const MEAL_LABELS: Record<MealData["type"], string> = {
  breakfast: "Café da manhã",
  "morning-snack": "Lanche da manhã",
  lunch: "Almoço",
  "afternoon-snack": "Lanche da tarde",
  dinner: "Jantar",
  "evening-snack": "Ceia",
};

const MEAL_ICONS: Record<MealData["type"], string> = {
  breakfast: "sunrise.fill",
  "morning-snack": "sun.max.fill",
  lunch: "sun.haze.fill",
  "afternoon-snack": "cloud.sun.fill",
  dinner: "moon.stars.fill",
  "evening-snack": "moon.fill",
};

const MEAL_ICON_COLORS: Record<MealData["type"], "warning" | "info"> = {
  breakfast: "warning",
  "morning-snack": "warning",
  lunch: "warning",
  "afternoon-snack": "warning",
  dinner: "info",
  "evening-snack": "info",
};

const renderStatusBadge = (meal: MealData) => {
  switch (meal.status) {
    case "completed":
      return (
        <span className="meal-badge meal-badge--completed">
          <NutriIcon name="checkmark.circle.fill" size="small" />
          Completa
        </span>
      );
    case "late":
      return (
        <span className="meal-badge meal-badge--late">
          <NutriIcon name="clock.badge.exclamationmark" size="small" />
          Atrasado
        </span>
      );
    case "in-progress":
      return (
        <span className="meal-badge meal-badge--progress">
          <NutriIcon name="ellipsis.circle" size="small" />
          Em andamento
        </span>
      );
    default:
      return null;
  }
};

export const MealTimeline: React.FC<MealTimelineProps> = ({
  initialDate = new Date(),
  meals,
  onDateChange,
  onAddFood,
  onEditFood,
  onDeleteFood,
  onDuplicateMeal,
  loading = false,
  error,
  onRetry,
  offline = false,
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(["breakfast"]));
  const timelineRef = useRef<HTMLDivElement>(null);
  const { announce } = useAnnouncement();

  useEffect(() => {
    const label = formatDateForDisplay(initialDate);
    announce(`Carregado ${label}`);
  }, [announce, initialDate]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleDateChange("next"),
    onSwipedRight: () => handleDateChange("previous"),
    preventDefaultTouchmoveEvent: false,
    trackMouse: false,
  });

  const formatDateForDisplay = (date: Date): string => {
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const handleDateChange = (direction: "previous" | "next" | "today") => {
    let newDate: Date;

    switch (direction) {
      case "previous":
        newDate = subDays(currentDate, 1);
        break;
      case "next":
        if (isToday(currentDate)) return;
        newDate = addDays(currentDate, 1);
        break;
      case "today":
        newDate = new Date();
        break;
      default:
        return;
    }

    setCurrentDate(newDate);
    onDateChange?.(newDate);

    const dateText = formatDateForDisplay(newDate);
    announce(`Navegado para ${dateText}`);
  };

  const toggleMealExpansion = (mealId: string) => {
    const newExpanded = new Set(expandedMeals);

    if (newExpanded.has(mealId)) {
      newExpanded.delete(mealId);
    } else {
      newExpanded.add(mealId);
    }

    setExpandedMeals(newExpanded);

    const meal = meals.find((m) => m.id === mealId);
    if (meal) {
      const action = newExpanded.has(mealId) ? "expandida" : "recolhida";
      announce(`${MEAL_LABELS[meal.type]} ${action}`);
    }
  };

  if (loading) {
    return <MealTimelineSkeleton />;
  }

  if (error) {
    return (
      <div className="meal-timeline-error">
        <p>{error}</p>
        {onRetry && (
          <NutriButton variant="secondary" onClick={onRetry} aria-label="Tentar novamente">
            Tentar novamente
          </NutriButton>
        )}
      </div>
    );
  }

  return (
    <section className="meal-timeline" aria-label="Refeições do dia" ref={timelineRef} {...swipeHandlers}>
      <header className="timeline-header">
        <div className="timeline-date-nav">
          <button
            className="date-nav-button"
            onClick={() => handleDateChange("previous")}
            aria-label="Dia anterior"
          >
            <NutriIcon name="chevron.left" />
          </button>

          <div className="timeline-current-date">
            <h2>{formatDateForDisplay(currentDate)}</h2>
            <p className="date-subtitle" aria-live="polite">
              {format(currentDate, "dd/MM/yyyy")} • {meals.reduce((sum, m) => sum + m.totalCalories, 0)} kcal registradas
              {offline && <span className="offline-badge">Dados salvos localmente</span>}
            </p>
          </div>

          <button
            className="date-nav-button"
            onClick={() => handleDateChange("next")}
            disabled={isToday(currentDate)}
            aria-label="Próximo dia"
          >
            <NutriIcon name="chevron.right" />
          </button>
        </div>

        <div className="timeline-quick-actions">
          <button className="quick-action-btn" onClick={() => handleDateChange("today")} disabled={isToday(currentDate)}>
            Hoje
          </button>
          <button className="quick-action-btn" onClick={() => handleDateChange("previous")}>
            Ontem
          </button>
        </div>
      </header>

      <div className="timeline-meals">
        {meals.length === 0 ? (
          <EmptyState
            message="Nenhuma refeição registrada ainda"
            action={
              <NutriButton variant="primary" onClick={() => hapticFeedback.medium()}>
                <NutriIcon name="plus.circle" />
                Registrar primeira refeição
              </NutriButton>
            }
          />
        ) : (
          meals.map((meal) => (
            <MealAccordion
              key={meal.id}
              meal={meal}
              isExpanded={expandedMeals.has(meal.id)}
              onToggle={() => toggleMealExpansion(meal.id)}
              onAddFood={(food) => {
                onAddFood?.(meal.id, food);
                hapticFeedback.medium();
              }}
              onEditFood={(foodId, updates) => onEditFood?.(meal.id, foodId, updates)}
              onDeleteFood={(foodId) => {
                onDeleteFood?.(meal.id, foodId);
                hapticFeedback.medium();
              }}
              onDuplicateMeal={() => onDuplicateMeal?.(meal.id)}
            />
          ))
        )}
      </div>
    </section>
  );
};

interface MealAccordionProps {
  meal: MealData;
  isExpanded: boolean;
  onToggle: () => void;
  onAddFood: (food: FoodItemData) => void;
  onEditFood: (foodId: string, updates: Partial<FoodItemData>) => void;
  onDeleteFood: (foodId: string) => void;
  onDuplicateMeal: () => void;
}

const MealAccordion: React.FC<MealAccordionProps> = ({
  meal,
  isExpanded,
  onToggle,
  onAddFood,
  onEditFood,
  onDeleteFood,
  onDuplicateMeal,
}) => {
  const [showFoodSearch, setShowFoodSearch] = useState(false);

  const displayedFoods = useMemo(() => {
    if (meal.foods.length > 20) {
      return meal.foods.slice(0, 20);
    }
    return meal.foods;
  }, [meal.foods]);

  const isTruncated = meal.foods.length > displayedFoods.length;

  return (
    <details className={`meal-accordion ${meal.status === "late" ? "meal-accordion--late" : ""}`} open={isExpanded} onToggle={onToggle}>
      <summary className="meal-summary">
        <div className="meal-info">
          <NutriIcon name={MEAL_ICONS[meal.type]} color={MEAL_ICON_COLORS[meal.type]} size="large" />
          <div className="meal-title-wrapper">
            <h3>{MEAL_LABELS[meal.type]}</h3>
            <time className="meal-time">{meal.time}</time>
          </div>
          {renderStatusBadge(meal)}
        </div>

        <div className="meal-summary-stats">
          <span className="meal-calories">{meal.totalCalories} kcal</span>
          <MacroBar
            protein={meal.macros.protein}
            carbs={meal.macros.carbs}
            fat={meal.macros.fat}
            size="small"
            hideLabels
            aria-label={`Macros: ${meal.macros.protein}g proteína, ${meal.macros.carbs}g carboidratos, ${meal.macros.fat}g gorduras`}
          />
        </div>

        <NutriIcon name="chevron.down" className="accordion-chevron" aria-hidden />
      </summary>

      <div className="meal-content">
        {displayedFoods.length > 0 ? (
          <ul className="meal-foods-list" role="list">
            {displayedFoods.map((food) => (
              <li key={food.id}>
                <FoodItem
                  name={food.name}
                  portion={food.portion}
                  calories={food.calories}
                  protein={food.macros.protein}
                  carbs={food.macros.carbs}
                  fat={food.macros.fat}
                  onEdit={() => onEditFood(food.id, {})}
                  onRemove={() => onDeleteFood(food.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="meal-empty-message">Nenhum alimento registrado ainda</p>
        )}

        {isTruncated && (
          <p className="meal-empty-message" role="status" aria-live="polite">
            Lista longa: mostrando 20 de {meal.foods.length} itens
          </p>
        )}

        <div className="meal-actions">
          <NutriButton variant="secondary" size="small" onClick={() => setShowFoodSearch(true)}>
            <NutriIcon name="plus.circle" />
            Adicionar item
          </NutriButton>

          <button
            className="meal-action-link"
            onClick={onDuplicateMeal}
            aria-label={`Duplicar ${MEAL_LABELS[meal.type]} para outro dia`}
          >
            <NutriIcon name="doc.on.doc" size="small" />
            Duplicar refeição
          </button>
        </div>

        {showFoodSearch && (
          <FoodSearchSheet
            onSelect={(food) => {
              onAddFood(food);
              setShowFoodSearch(false);
            }}
            onClose={() => setShowFoodSearch(false)}
          />
        )}
      </div>
    </details>
  );
};

const MealTimelineSkeleton: React.FC = () => {
  return (
    <div className="meal-timeline-skeleton">
      <div className="skeleton-header shimmer" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-meal">
          <div className="skeleton-meal-header shimmer" />
          <div className="skeleton-meal-bar shimmer" />
        </div>
      ))}
    </div>
  );
};

const EmptyState: React.FC<{ message: string; action?: React.ReactNode }> = ({ message, action }) => {
  return (
    <div className="meal-timeline-empty">
      <img src="/illustrations/empty-diary.svg" alt="" aria-hidden className="empty-illustration" />
      <h3>{message}</h3>
      {action}
    </div>
  );
};

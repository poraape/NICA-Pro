import { useEffect, useMemo, useState } from "react";

interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  source: string;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

const mockFoods: FoodSearchResult[] = [
  { id: "1", name: "Maçã", calories: 95, source: "Base local", macros: { protein: 0.5, carbs: 25, fat: 0.3 } },
  { id: "2", name: "Iogurte grego", calories: 120, source: "Base local", macros: { protein: 10, carbs: 8, fat: 5 } },
  { id: "3", name: "Peito de frango grelhado", calories: 165, source: "Base local", macros: { protein: 31, carbs: 0, fat: 4 } },
  { id: "4", name: "Arroz integral", calories: 216, source: "Base local", macros: { protein: 5, carbs: 45, fat: 2 } },
  { id: "5", name: "Abacate", calories: 160, source: "Base local", macros: { protein: 2, carbs: 8, fat: 15 } },
];

/**
 * Debounced food search hook. Filters mock data while waiting for backend integration.
 */
export const useFoodSearch = (query: string, delay = 300) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FoodSearchResult[]>([]);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = window.setTimeout(() => {
      const filtered = mockFoods.filter((food) =>
        food.name.toLowerCase().includes(normalizedQuery)
      );
      setResults(filtered);
      setLoading(false);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delay, normalizedQuery]);

  return { results, loading };
};

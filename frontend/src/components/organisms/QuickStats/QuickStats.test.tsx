import { render, screen } from "@testing-library/react";
import React from "react";

import { QuickStats, QuickStatsData } from "./QuickStats";

const mockData: QuickStatsData = {
  calories: { consumed: 1200, target: 2000, remaining: 800 },
  macros: { protein: 90, carbs: 160, fat: 50 },
  hydration: { current: 1.2, target: 2.5 },
  meals: { completed: 2, total: 4 },
};

describe("QuickStats", () => {
  it("renders empty state when no data", () => {
    render(<QuickStats />);
    expect(screen.getByText(/Registre sua primeira refeição/i)).toBeInTheDocument();
  });

  it("shows calorie progress label", () => {
    render(<QuickStats data={mockData} />);
    expect(screen.getByLabelText(/Progresso de calorias/i)).toBeInTheDocument();
  });

  it("describes hydration progress", () => {
    render(<QuickStats data={mockData} />);
    expect(screen.getByLabelText(/Progresso de hidratação/i)).toBeInTheDocument();
  });
});

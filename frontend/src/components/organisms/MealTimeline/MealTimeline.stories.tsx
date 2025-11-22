import type { Meta, StoryObj } from "@storybook/react";

import { MealTimeline, MealData } from "./MealTimeline";

const meals: MealData[] = [
  {
    id: "breakfast",
    type: "breakfast",
    time: "08:00",
    foods: [
      {
        id: "1",
        name: "Iogurte grego",
        portion: "1 pote",
        calories: 120,
        macros: { protein: 10, carbs: 8, fat: 5 },
      },
    ],
    totalCalories: 320,
    macros: { protein: 20, carbs: 35, fat: 8 },
    status: "completed",
  },
  {
    id: "lunch",
    type: "lunch",
    time: "12:30",
    foods: [
      {
        id: "2",
        name: "Frango grelhado",
        portion: "150g",
        calories: 230,
        macros: { protein: 40, carbs: 0, fat: 6 },
      },
    ],
    totalCalories: 530,
    macros: { protein: 50, carbs: 40, fat: 12 },
    status: "in-progress",
  },
];

const meta: Meta<typeof MealTimeline> = {
  title: "Organisms/MealTimeline",
  component: MealTimeline,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof MealTimeline>;

export const Default: Story = {
  args: {
    meals,
  },
};

export const Loading: Story = {
  args: {
    meals: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    meals: [],
  },
};

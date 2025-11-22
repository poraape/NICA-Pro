import type { Meta, StoryObj } from "@storybook/react";

import { QuickStats, QuickStatsData } from "./QuickStats";

const sampleData: QuickStatsData = {
  calories: { consumed: 1450, target: 2000, remaining: 550 },
  macros: { protein: 110, carbs: 180, fat: 60 },
  hydration: { current: 1.6, target: 2.4 },
  meals: { completed: 3, total: 4 },
};

const meta: Meta<typeof QuickStats> = {
  title: "Organisms/QuickStats",
  component: QuickStats,
};

export default meta;

type Story = StoryObj<typeof QuickStats>;

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: undefined,
    isLoading: false,
  },
};

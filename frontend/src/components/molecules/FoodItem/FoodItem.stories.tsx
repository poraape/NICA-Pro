import type { Meta, StoryObj } from "@storybook/react";

import { FoodItem } from "./FoodItem";

const meta: Meta<typeof FoodItem> = {
  title: "Molecules/FoodItem",
  component: FoodItem,
  args: {
    name: "Salada de Quinoa",
    portion: "1 bowl (250g)",
    calories: 320,
    protein: 18,
    carbs: 42,
    fat: 10,
  },
};

export default meta;

type Story = StoryObj<typeof FoodItem>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    onEdit: () => console.log("edit"),
    onRemove: () => console.log("remove"),
    onComplete: () => console.log("complete"),
  },
};

export const WithThumbnail: Story = {
  args: {
    thumbnailUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=60",
  },
};

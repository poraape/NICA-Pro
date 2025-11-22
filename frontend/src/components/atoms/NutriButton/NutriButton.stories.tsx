import React from "react";

import { NutriButton } from "./NutriButton";

const meta = {
  title: "Atoms/NutriButton",
  component: NutriButton,
} satisfies { title: string; component: typeof NutriButton };

export default meta;

type Story = { render: () => JSX.Element };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <NutriButton variant="primary">Primary</NutriButton>
      <NutriButton variant="secondary">Secondary</NutriButton>
      <NutriButton variant="tertiary">Tertiary</NutriButton>
      <NutriButton variant="destructive">Destructive</NutriButton>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <NutriButton size="small">Small</NutriButton>
      <NutriButton size="medium">Medium</NutriButton>
      <NutriButton size="large">Large</NutriButton>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <NutriButton>Default</NutriButton>
      <NutriButton disabled>Disabled</NutriButton>
      <NutriButton loading>Loading</NutriButton>
    </div>
  ),
};

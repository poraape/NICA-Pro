import React from "react";

import { NutriCard } from "./NutriCard";

const meta = {
  title: "Molecules/NutriCard",
  component: NutriCard,
} satisfies { title: string; component: typeof NutriCard };

export default meta;

type Story = { render: () => JSX.Element };

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <NutriCard>Default</NutriCard>
      <NutriCard variant="elevated">Elevated</NutriCard>
      <NutriCard status="on-track">On track</NutriCard>
      <NutriCard status="near-limit">Near limit</NutriCard>
      <NutriCard status="exceeded">Exceeded</NutriCard>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <NutriCard onClick={() => {}} ariaLabel="Clickable card" variant="elevated" status="on-track">
      Clickable NutriCard with keyboard/hover affordances
    </NutriCard>
  ),
};

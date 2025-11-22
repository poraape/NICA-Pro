import React from "react";

import { NutriSpinner } from "./NutriSpinner";

const meta = {
  title: "Atoms/NutriSpinner",
  component: NutriSpinner,
} satisfies { title: string; component: typeof NutriSpinner };

export default meta;

type Story = { render: () => JSX.Element };

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <NutriSpinner size="small" />
      <NutriSpinner size="medium" />
      <NutriSpinner size="large" />
    </div>
  ),
};

export const CustomColor: Story = {
  render: () => <NutriSpinner size="large" color="#E53935" ariaLabel="Carregando dados" />,
};

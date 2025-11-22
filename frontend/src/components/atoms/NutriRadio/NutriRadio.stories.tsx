import React from "react";

import { NutriRadio } from "./NutriRadio";

const meta = {
  title: "Atoms/NutriRadio",
  component: NutriRadio,
} satisfies { title: string; component: typeof NutriRadio };

export default meta;

type Story = { render: () => JSX.Element };

export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      <NutriRadio name="plan" label="Básico" value="basic" defaultChecked />
      <NutriRadio name="plan" label="Pro" value="pro" />
      <NutriRadio name="plan" label="Enterprise" value="enterprise" disabled />
      <NutriRadio name="plan" label="Erro" value="error" error="Selecione um plano" />
    </div>
  ),
};

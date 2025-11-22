import React from "react";

import { NutriCheckbox } from "./NutriCheckbox";

const meta = {
  title: "Atoms/NutriCheckbox",
  component: NutriCheckbox,
} satisfies { title: string; component: typeof NutriCheckbox };

export default meta;

type Story = { render: () => JSX.Element };

export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      <NutriCheckbox label="Padrão" description="Estado inicial" />
      <NutriCheckbox label="Selecionado" defaultChecked />
      <NutriCheckbox label="Indeterminado" indeterminate />
      <NutriCheckbox label="Erro" error="Selecione ao menos um" />
      <NutriCheckbox label="Desabilitado" disabled />
    </div>
  ),
};

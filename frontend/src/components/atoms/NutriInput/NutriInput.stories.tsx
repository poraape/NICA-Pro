import React from "react";

import { NutriInput } from "./NutriInput";

const meta = {
  title: "Atoms/NutriInput",
  component: NutriInput,
} satisfies { title: string; component: typeof NutriInput };

export default meta;

type Story = { render: () => JSX.Element };

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      <NutriInput label="Text" variant="text" placeholder="Digite algo" />
      <NutriInput label="Number" variant="number" placeholder="42" />
      <NutriInput label="Search" variant="search" placeholder="Buscar" />
      <NutriInput label="Notes" variant="textarea" description="Suporte a texto multilinha" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      <NutriInput label="Default" placeholder="Placeholder" />
      <NutriInput label="Filled" defaultValue="Conteúdo" />
      <NutriInput label="Erro" error="Campo obrigatório" />
      <NutriInput label="Desabilitado" disabled />
    </div>
  ),
};

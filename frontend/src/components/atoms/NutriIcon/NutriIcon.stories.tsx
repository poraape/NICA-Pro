import React from "react";

import { NutriIcon } from "./NutriIcon";

const meta = {
  title: "Atoms/NutriIcon",
  component: NutriIcon,
} satisfies { title: string; component: typeof NutriIcon };

export default meta;

type Story = { render: () => JSX.Element };

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <NutriIcon name="favorite" size="small" ariaLabel="Favorito pequeno" />
      <NutriIcon name="favorite" size="medium" ariaLabel="Favorito médio" />
      <NutriIcon name="favorite" size="large" ariaLabel="Favorito grande" />
      <NutriIcon name="favorite" size="xl" ariaLabel="Favorito extra" />
    </div>
  ),
};

export const WeightsAndTone: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", color: "#4CAF50" }}>
      <NutriIcon name="bolt" weight="ultralight" />
      <NutriIcon name="bolt" weight="regular" />
      <NutriIcon name="bolt" weight="bold" />
      <NutriIcon name="bolt" tone="hierarchical" />
      <NutriIcon name="bolt" tone="multicolor" />
    </div>
  ),
};

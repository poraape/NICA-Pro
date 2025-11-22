import type { Meta, StoryObj } from "@storybook/react";

import { NutriProgressRing } from "./NutriProgressRing";

const meta: Meta<typeof NutriProgressRing> = {
  title: "Molecules/NutriProgressRing",
  component: NutriProgressRing,
  args: {
    value: 65,
    label: "calorias",
    unit: "%",
  },
};

export default meta;

type Story = StoryObj<typeof NutriProgressRing>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
      <NutriProgressRing value={35} size="small" label="proteína" />
      <NutriProgressRing value={65} size="medium" label="calorias" />
      <NutriProgressRing value={85} size="large" label="hidratação" unit="%" />
    </div>
  ),
};

export const CustomUnit: Story = {
  args: {
    value: 72,
    unit: "kcal",
    label: "calorias",
  },
};

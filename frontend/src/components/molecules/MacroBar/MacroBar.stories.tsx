import type { Meta, StoryObj } from "@storybook/react";

import { MacroBar } from "./MacroBar";

const meta: Meta<typeof MacroBar> = {
  title: "Molecules/MacroBar",
  component: MacroBar,
  args: {
    protein: 40,
    carbs: 90,
    fat: 30,
    goal: 180,
    size: "medium",
  },
};

export default meta;

type Story = StoryObj<typeof MacroBar>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      <MacroBar protein={25} carbs={55} fat={20} size="small" goal={120} />
      <MacroBar protein={35} carbs={75} fat={30} size="medium" goal={140} />
      <MacroBar protein={45} carbs={85} fat={35} size="large" goal={180} />
    </div>
  ),
};

export const Textured: Story = {
  args: {
    showTextures: true,
    protein: 35,
    carbs: 65,
    fat: 25,
    goal: 150,
  },
};

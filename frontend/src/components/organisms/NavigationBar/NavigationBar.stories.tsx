import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { NavigationBar, type NavigationItem } from "./NavigationBar";

const Template = ({ items }: { items?: NavigationItem[] }) => (
  <MemoryRouter initialEntries={["/"]}>
    <div style={{ paddingBottom: 80, minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/diary" element={<div>Diary</div>} />
        <Route path="/plan" element={<div>Plan</div>} />
        <Route path="/progress" element={<div>Progress</div>} />
        <Route path="/profile" element={<div>Profile</div>} />
      </Routes>
      <NavigationBar items={items} />
    </div>
  </MemoryRouter>
);

const meta: Meta<typeof NavigationBar> = {
  title: "Organisms/NavigationBar",
  component: NavigationBar,
  render: (args) => <Template {...args} />, 
};

export default meta;

type Story = StoryObj<typeof NavigationBar>;

export const Default: Story = {};

export const WithBadges: Story = {
  args: {
    items: [
      { id: "home", path: "/", label: "Home", icon: "house", iconFilled: "house.fill" },
      { id: "diary", path: "/diary", label: "Diário", icon: "book", iconFilled: "book.fill", badge: 3 },
      { id: "plan", path: "/plan", label: "Plano", icon: "chart.bar", iconFilled: "chart.bar.fill" },
      { id: "progress", path: "/progress", label: "Progresso", icon: "chart.line.uptrend.xyaxis" },
      { id: "profile", path: "/profile", label: "Perfil", icon: "person.crop.circle", iconFilled: "person.crop.circle.fill", badge: 12 },
    ],
  },
};

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";

import { NutriCard } from "./NutriCard";

describe("NutriCard", () => {
  it("exposes article semantics by default", () => {
    render(<NutriCard>Content</NutriCard>);
    const card = screen.getByRole("article");
    expect(card).toBeInTheDocument();
    expect(card).not.toHaveAttribute("tabindex");
  });

  it("supports keyboard activation when clickable", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <NutriCard onClick={handleClick} ariaLabel="Card" status="on-track">
        Actionable card
      </NutriCard>
    );

    const buttonCard = screen.getByRole("button", { name: "Card" });
    expect(buttonCard).toHaveAttribute("tabindex", "0");

    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});

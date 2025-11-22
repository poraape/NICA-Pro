import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";

import { NutriRadio } from "./NutriRadio";

describe("NutriRadio", () => {
  it("marca aria-invalid quando erro está presente", () => {
    render(<NutriRadio name="plan" label="Pro" value="pro" error="Obrigatório" />);
    const radio = screen.getByLabelText("Pro");
    expect(radio).toHaveAttribute("aria-invalid", "true");
  });

  it("propaga seleção via onChange", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NutriRadio name="theme" label="Dark" value="dark" onChange={handleChange} />);

    const radio = screen.getByLabelText("Dark");
    await user.click(radio);
    expect(handleChange).toHaveBeenCalled();
  });
});

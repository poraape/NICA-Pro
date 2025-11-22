import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";

import { NutriCheckbox } from "./NutriCheckbox";

describe("NutriCheckbox", () => {
  it("vincula label ao input e respeita aria-invalid", () => {
    render(<NutriCheckbox label="Aceito" error="Obrigatório" />);
    const checkbox = screen.getByLabelText("Aceito");
    expect(checkbox).toHaveAttribute("type", "checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
  });

  it("propaga mudanças de seleção", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<NutriCheckbox label="Newsletter" onChange={handleChange} />);

    const checkbox = screen.getByLabelText("Newsletter");
    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import React from "react";

import { NutriSpinner } from "./NutriSpinner";

describe("NutriSpinner", () => {
  it("renderiza com role status e aria-label padrão", () => {
    render(<NutriSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("aria-label", "Carregando");
  });

  it("aceita aria-label customizado", () => {
    render(<NutriSpinner ariaLabel="Processando" />);
    expect(screen.getByLabelText("Processando")).toBeInTheDocument();
  });
});

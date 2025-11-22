import { render, screen } from "@testing-library/react";
import React from "react";

import { NutriIcon } from "./NutriIcon";

describe("NutriIcon", () => {
  it("marca aria-hidden quando não possui ariaLabel", () => {
    render(<NutriIcon name="check" />);
    const icon = screen.getByText("check");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("usa role img quando ariaLabel é fornecido", () => {
    render(<NutriIcon name="check" ariaLabel="Confirmar" />);
    expect(screen.getByLabelText("Confirmar")).toHaveAttribute("role", "img");
  });
});

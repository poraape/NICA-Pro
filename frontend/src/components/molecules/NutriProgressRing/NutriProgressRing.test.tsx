import { render, screen } from "@testing-library/react";
import React from "react";

import { NutriProgressRing } from "./NutriProgressRing";

describe("NutriProgressRing", () => {
  it("renders an accessible label with progress value", () => {
    render(<NutriProgressRing value={65} label="calorias" />);
    expect(screen.getByRole("img", { name: /calorias: 65%/i })).toBeInTheDocument();
  });

  it("applies stroke dashoffset based on value", () => {
    render(<NutriProgressRing value={50} />);
    const indicator = screen.getByRole("img").querySelector(".nutri-progress-ring__indicator");
    expect(indicator?.getAttribute("stroke-dashoffset")).not.toBeNull();
  });
});

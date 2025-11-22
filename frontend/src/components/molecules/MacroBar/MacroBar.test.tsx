import { render, screen } from "@testing-library/react";
import React from "react";

import { MacroBar } from "./MacroBar";

describe("MacroBar", () => {
  it("announces macro distribution via aria label", () => {
    render(<MacroBar protein={30} carbs={50} fat={20} goal={120} />);
    expect(screen.getByRole("img", { name: /proteína 30g/i })).toBeInTheDocument();
  });

  it("shows goal indicator when goal is provided", () => {
    render(<MacroBar protein={10} carbs={10} fat={10} goal={30} />);
    expect(screen.getByRole("img").querySelector(".macro-bar__goal")).toBeInTheDocument();
  });
});

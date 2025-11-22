import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";

import { NutriInput } from "./NutriInput";

describe("NutriInput", () => {
  it("associa label e input com ids acessíveis", () => {
    render(<NutriInput label="Nome" variant="text" description="Descrição" />);
    const input = screen.getByLabelText("Nome");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby");
  });

  it("marca aria-invalid quando há erro e vincula mensagem", () => {
    render(<NutriInput label="Email" variant="text" error="Formato inválido" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Formato inválido");
  });

  it("suporta interação controlada", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <NutriInput label="Busca" variant="search" value="a" onChange={handleChange} ariaDescribedBy="hint" />
    );

    const input = screen.getByLabelText("Busca");
    await user.type(input, "b");
    expect(handleChange).toHaveBeenCalled();
  });
});

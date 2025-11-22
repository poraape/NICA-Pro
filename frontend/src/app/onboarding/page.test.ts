import { validateForm } from "./page";

describe("validateForm", () => {
  it("rejects invalid email and short name", () => {
    const { errors } = validateForm({
      full_name: "Jo",
      email: "invalid",
      age: "9",
      gender: "",
      weight: "10",
      height: "40",
      goal: "maintain",
      activity_level: "moderate",
      calories_target: "50",
      protein_target: "5",
    });

    expect(errors.full_name).toBe("Informe seu nome completo");
    expect(errors.email).toBe("E-mail inválido");
    expect(errors.age).toBe("Idade entre 10 e 120");
    expect(errors.weight).toBe("Peso deve ficar entre 20kg e 500kg");
    expect(errors.height).toBe("Altura deve ficar entre 50cm e 250cm");
    expect(errors.calories_target).toBe("Calorias entre 800 e 6000");
    expect(errors.protein_target).toBe("Proteína entre 20g e 400g");
    expect(Object.keys(errors)).toHaveLength(7);
  });

  it("returns parsed payload when valid", () => {
    const { errors, data } = validateForm({
      full_name: "Julia Souza",
      email: "julia@example.com",
      age: "28",
      gender: "female",
      weight: "62",
      height: "170",
      goal: "gain",
      activity_level: "light",
      calories_target: "2200",
      protein_target: "130",
    });

    expect(errors).toEqual({});
    expect(data).toEqual({
      full_name: "Julia Souza",
      email: "julia@example.com",
      age: 28,
      gender: "female",
      weight: 62,
      height: 170,
      goal: "gain",
      activity_level: "light",
      calories_target: 2200,
      protein_target: 130,
    });
  });
});

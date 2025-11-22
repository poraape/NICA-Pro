import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";

import { FoodItem } from "./FoodItem";

describe("FoodItem", () => {
  it("exposes article semantics and descriptive label", () => {
    render(<FoodItem name="Apple" portion="1 unidade" calories={80} protein={0} carbs={21} fat={0} />);
    expect(screen.getByRole("article", { name: /apple/i })).toBeInTheDocument();
  });

  it("fires long press callback after 500ms", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<FoodItem name="Banana" portion="120g" onLongPress={onLongPress} />);

    const card = screen.getByRole("article");
    fireEvent.pointerDown(card, { clientX: 0, pointerId: 1, pointerType: "touch" });
    vi.advanceTimersByTime(600);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(card, { clientX: 0, pointerId: 1, pointerType: "touch" });
    vi.useRealTimers();
  });

  it("commits completion on swipe right beyond threshold", () => {
    const onComplete = vi.fn();
    render(<FoodItem name="Wrap" portion="200g" onComplete={onComplete} />);

    const card = screen.getByRole("article");
    Object.defineProperty(card, "offsetWidth", { value: 200, configurable: true });

    fireEvent.pointerDown(card, { clientX: 0, pointerId: 1, pointerType: "touch" });
    fireEvent.pointerMove(card, { clientX: 150, pointerId: 1, pointerType: "touch" });
    fireEvent.pointerUp(card, { clientX: 150, pointerId: 1, pointerType: "touch" });

    expect(onComplete).toHaveBeenCalled();
  });

  it("supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<FoodItem name="Soup" portion="300ml" onComplete={onComplete} />);

    const card = screen.getByRole("article");
    card.focus();
    await user.keyboard("{Enter}");

    expect(onComplete).toHaveBeenCalled();
  });
});

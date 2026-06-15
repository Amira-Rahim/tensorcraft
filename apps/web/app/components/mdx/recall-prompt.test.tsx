import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallPrompt } from "./recall-prompt";

describe("RecallPrompt", () => {
  it("hides the answer and self-rate buttons until revealed", () => {
    render(<RecallPrompt question="Q?" answer="A." />);
    expect(screen.queryByText("A.")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /got it/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals the answer and shows self-rate buttons", () => {
    render(<RecallPrompt question="Q?" answer="A." />);
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /got it/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /review again/i }),
    ).toBeInTheDocument();
  });

  it("fires onAnswer with the chosen result", () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt question="Q?" answer="A." onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onAnswer).toHaveBeenCalledWith("got-it");
  });
});

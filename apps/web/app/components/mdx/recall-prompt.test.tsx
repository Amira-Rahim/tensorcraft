import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallPrompt } from "./recall-prompt";

describe("RecallPrompt", () => {
  it("requires a non-whitespace attempt before checking", () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt question="Q?" answer="A." onAnswer={onAnswer} />);
    const check = screen.getByRole("button", { name: "Check" });
    expect(check).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Q?" }), {
      target: { value: "  \n " },
    });
    expect(check).toBeDisabled();
    fireEvent.click(check);
    expect(screen.queryByText("A.")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "My private attempt" },
    });
    fireEvent.click(check);
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("attempted");
    expect(screen.getByText("A.")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Answer revealed.");
    expect(screen.getByRole("status")).not.toHaveTextContent("A.");
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onAnswer).toHaveBeenLastCalledWith("got-it");
    expect(
      screen.queryByRole("button", { name: "Got it" }),
    ).not.toBeInTheDocument();
  });
  it("records a bail once and leaves the answer available to read", () => {
    const onAnswer = vi.fn();
    render(
      <RecallPrompt question="Q?" onAnswer={onAnswer}>
        <strong>Answer as children</strong>
      </RecallPrompt>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "I couldn't recall it" }),
    );
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("bailed");
    expect(screen.getByText("Answer as children")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Got it" }),
    ).not.toBeInTheDocument();
  });
});

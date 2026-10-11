import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallPrompt } from "./recall-prompt";

describe("RecallPrompt", () => {
  it("requires a non-whitespace attempt before revealing the self-assessment answer", () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt question="Q?" answer="A." onAnswer={onAnswer} />);
    const check = screen.getByRole("button", { name: "Show answer" });
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

it("labels ungraded reflection and keeps the learner response available for comparison and retry", () => {
  const onAnswer = vi.fn();
  render(
    <RecallPrompt
      question="Explain your reasoning."
      answer="Example reasoning."
      onAnswer={onAnswer}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Self-assessment" }),
  ).toBeVisible();
  expect(screen.getByText(/not automatically graded/)).toBeVisible();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "My reasoning." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
  expect(screen.getByText("My reasoning.")).toBeVisible();
  expect(screen.getByText("Example reasoning.")).toBeVisible();
  expect(onAnswer.mock.calls).toEqual([["attempted"]]);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.getByRole("textbox")).toHaveValue("My reasoning.");
  expect(screen.getByRole("textbox")).toHaveFocus();
});

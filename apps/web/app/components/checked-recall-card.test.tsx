import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import type { RecallCheck } from "@tensorcraft/shared";
import { RecallPrompt } from "./mdx/recall-prompt";

const checks: RecallCheck[] = [
  {
    kind: "shape",
    question: "What is the shape?",
    expected: [3],
    hint: "Count the three elements and use brackets.",
    explanation: "One dimension of length 3.",
  },
  {
    kind: "choice",
    question: "Does it train a model?",
    options: [
      {
        text: "Yes",
        feedback: "Creating a tensor does not update model weights.",
      },
      { text: "No", feedback: "Correct." },
    ],
    correctIndex: 1,
    explanation: "It only creates a tensor.",
  },
];
function mount() {
  const onAnswer = vi.fn();
  const view = render(
    <RecallPrompt
      question="Consider tf.tensor([0.2, 0.4, 0.6])."
      answer="Shape [3]; no training."
      checks={checks}
      onAnswer={onAnswer}
    />,
  );
  return { ...view, onAnswer };
}
function answer(shape: string, choice: "Yes" | "No") {
  fireEvent.change(
    screen.getByRole("textbox", { name: "What is the shape?" }),
    { target: { value: shape } },
  );
  fireEvent.click(screen.getByRole("radio", { name: choice }));
}

describe("checked recall", () => {
  it("requires an answer to every part", () => {
    const { onAnswer } = mount();
    expect(
      screen.getByRole("button", { name: "Check answers" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "[3]" } });
    expect(
      screen.getByRole("button", { name: "Check answers" }),
    ).toBeDisabled();
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    expect(screen.getByRole("button", { name: "Check answers" })).toBeEnabled();
  });
  it("rejects arbitrary text instead of treating any filled field as correct", () => {
    const { onAnswer } = mount();
    answer("anything", "No");
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2 correct");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(onAnswer.mock.calls).toEqual([["attempted"]]);
    expect(
      screen.queryByRole("button", { name: "Got it" }),
    ).not.toBeInTheDocument();
  });
  it("retains correct parts and lets an incorrect part be retried without recording success", () => {
    const { onAnswer } = mount();
    answer(" [ 3 ] ", "Yes");
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
    expect(screen.getByRole("status")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2 correct");
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(
      screen.getByText("Creating a tensor does not update model weights."),
    ).toBeVisible();
    expect(onAnswer.mock.calls).toEqual([["attempted"]]);
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "All answers are correct. You corrected an earlier mistake.",
    );
    expect(onAnswer.mock.calls).toEqual([["attempted"], ["review"]]);
    fireEvent.submit(screen.getByRole("form", { name: "Knowledge check" }));
    expect(onAnswer).toHaveBeenCalledTimes(2);
  });
  it("records first-attempt correctness once, without self-rating buttons", () => {
    const { onAnswer } = mount();
    answer("[3]", "No");
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
    expect(onAnswer.mock.calls).toEqual([["attempted"], ["got-it"]]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "All answers are correct.",
    );
    expect(
      screen.queryByRole("button", { name: "Got it" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Check again" }),
    ).not.toBeInTheDocument();
  });
  it("reveals all parts as answers, without claiming that the attempt was correct", () => {
    const { onAnswer } = mount();
    fireEvent.click(
      screen.getByRole("button", { name: "I couldn't recall it" }),
    );
    expect(screen.getByText("Expected answer: [3].")).toBeVisible();
    expect(screen.getByText("Expected answer: No.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Answers revealed.");
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("bailed");
    expect(screen.queryByText("Correct.")).not.toBeInTheDocument();
  });
  it("has accessible labels, groups and feedback before and after an incorrect attempt", async () => {
    const { container } = mount();
    expect((await axe(container)).violations).toEqual([]);
    answer("[1, 3]", "Yes");
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }));
    expect((await axe(container)).violations).toEqual([]);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { DecisionTask } from "./decision-task";
import {
  checkDecision,
  decisionDraft,
  parseDecision,
  readyToSubmit,
} from "./decision-task-data";
beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());
const fill = () => {
  fireEvent.change(screen.getByLabelText("Your reasoning"), {
    target: {
      value: "Two missed failures cost 16 and twelve reviews cost 12.",
    },
  });
  fireEvent.change(screen.getByLabelText("Help used, or None"), {
    target: { value: "None" },
  });
  fireEvent.change(screen.getByLabelText("Minutes spent (your estimate)"), {
    target: { value: "4" },
  });
};
it("reveals feedback only after submission and retains the first attempt after a correction", () => {
  const view = render(<DecisionTask id="review-costs" />);
  expect(screen.queryByText(/Costs are 80 minutes/)).not.toBeInTheDocument();
  const submit = screen.getByRole("button", {
    name: "Submit decision and show feedback",
  });
  expect(submit).toBeDisabled();
  fill();
  fireEvent.click(screen.getByLabelText("Never flag a build"));
  fireEvent.change(screen.getByLabelText(/Total error cost/), {
    target: { value: "80" },
  });
  fireEvent.click(submit);
  expect(
    screen.getByText(/Recheck the stated constraints/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Use the model"));
  fireEvent.change(screen.getByLabelText(/Total error cost/), {
    target: { value: "28" },
  });
  fireEvent.click(submit);
  const draft = parseDecision(
    sessionStorage.getItem("tensorcraft:decision:v1:review-costs")!,
    "review-costs",
  );
  expect(draft.attempts.map((a) => a.choice)).toEqual(["baseline", "model"]);
  view.unmount();
  render(<DecisionTask id="review-costs" />);
  expect(screen.getByText(/Attempt 2:/)).toBeInTheDocument();
  expect(
    screen.getByText(/has not been automatically graded/),
  ).toBeInTheDocument();
});
it("keeps different tasks separate when navigation reuses the component", () => {
  const view = render(<DecisionTask id="review-costs" />);
  fill();
  view.rerender(<DecisionTask id="rule-or-model" />);
  expect(screen.getByLabelText("Your reasoning")).toHaveValue("");
  view.rerender(<DecisionTask id="review-costs" />);
  expect(screen.getByLabelText("Your reasoning")).toHaveValue(
    "Two missed failures cost 16 and twelve reviews cost 12.",
  );
});
it("recovers from corrupt or blocked tab storage", () => {
  sessionStorage.setItem("tensorcraft:decision:v1:review-costs", "{broken");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("blocked");
  });
  render(<DecisionTask id="review-costs" />);
  expect(screen.getByRole("alert")).toHaveTextContent("previous draft");
  expect(
    screen.getByRole("button", { name: "Download decision record" }),
  ).toBeEnabled();
});
it("checks costs and refuses incomplete evidence without pretending to grade prose", () => {
  const d = decisionDraft("review-costs");
  expect(readyToSubmit(d)).toBe(false);
  expect(() =>
    parseDecision(
      JSON.stringify({ ...d, attempts: [{ choice: "model" }] }),
      "review-costs",
    ),
  ).toThrow();
  const attempt = {
    choice: "rule",
    calculation: "26",
    rationale: "...",
    help: "None",
    minutes: "2",
    submittedAt: new Date().toISOString(),
  };
  expect(checkDecision("rule-or-model", attempt)).toEqual({
    choiceCorrect: true,
    calculationCorrect: true,
  });
  expect(
    checkDecision("review-costs", {
      ...attempt,
      choice: "baseline",
      calculation: "80",
    }),
  ).toEqual({ choiceCorrect: false, calculationCorrect: true });
  expect(checkDecision("review-costs", attempt)).toEqual({
    choiceCorrect: false,
    calculationCorrect: false,
  });
  expect(
    checkDecision("review-costs", {
      ...attempt,
      choice: "model",
      calculation: "",
    }).calculationCorrect,
  ).toBe(false);
});

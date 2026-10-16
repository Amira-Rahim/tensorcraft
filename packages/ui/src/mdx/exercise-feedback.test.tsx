import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Exercise, ExerciseDataProvider, type ExerciseData } from "./exercise";
import { parseAndRunTests } from "./exercise-runner";

vi.mock("../use-scheme", () => ({ useScheme: () => "dark" }));
vi.mock("./exercise-runner", () => ({ parseAndRunTests: vi.fn() }));
vi.mock("@codesandbox/sandpack-react", () => ({
  SandpackProvider: ({ children }: { children: React.ReactNode }) => children,
  SandpackCodeEditor: () => null,
  useSandpack: () => ({
    sandpack: {
      files: { "/index.js": { code: "const answer = 0;" } },
      updateFile: vi.fn(),
    },
  }),
}));

const exercise: ExerciseData = {
  slug: "feedback-regression",
  title: "Check the readings",
  instructions: "Keep each reading in order.",
  starterCode: "const answer = 0;",
  solutionCode: "const answer = 1;",
  testCode: "",
  estimatedMinutes: 2,
  difficulty: "beginner",
};

function renderExercise() {
  return render(
    <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
      <Exercise slug={exercise.slug} />
    </ExerciseDataProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(parseAndRunTests).mockReset();
});

describe("Exercise graded feedback", () => {
  it("names a partial run as not passed and labels every failed check", async () => {
    vi.mocked(parseAndRunTests).mockResolvedValue({
      results: [
        { name: "shape matches", passed: true },
        {
          name: "readings stay in order",
          passed: false,
          error: "Check the reading at index 1.",
        },
      ],
      logs: [],
    });
    renderExercise();
    const announcement = screen.getByRole("status");
    expect(announcement).toBeEmptyDOMElement();
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));

    const panel = await screen.findByTestId("test-results-panel");
    expect(
      within(panel).getByText("Not passed yet: 1 of 2 tests passed"),
    ).toBeVisible();
    expect(within(panel).getByText("Failed:")).toBeVisible();
    expect(within(panel).getByText("Passed:")).toBeVisible();
    expect(
      within(panel).getByText("Check the reading at index 1."),
    ).toBeVisible();
    expect(announcement).toHaveTextContent(
      "Challenge not passed. 1 of 2 tests passed. Failed: readings stay in order.",
    );
    expect(announcement).toHaveAttribute("aria-live", "polite");
    expect(announcement).toHaveAttribute("aria-atomic", "true");
    expect(
      within(panel).queryByText("All tests passed!"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByTestId("test-results-panel")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBe(announcement);
    expect(announcement).toBeEmptyDOMElement();
  });

  it("shows success only after every check passes", async () => {
    vi.mocked(parseAndRunTests).mockResolvedValue({
      results: [
        { name: "shape matches", passed: true },
        { name: "readings stay in order", passed: true },
      ],
      logs: [],
    });
    renderExercise();
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    const panel = await screen.findByTestId("test-results-panel");
    expect(within(panel).getByText("All tests passed!")).toBeVisible();
    expect(within(panel).queryByText("Failed:")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("All 2 tests passed.");
  });

  it("reports a crashed run as not passed and preserves the runtime error", async () => {
    vi.mocked(parseAndRunTests).mockRejectedValue(
      new Error("Unexpected token"),
    );
    renderExercise();
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    const panel = await screen.findByTestId("test-results-panel");
    expect(
      within(panel).getByText("Not passed yet: 0 of 1 test passed"),
    ).toBeVisible();
    expect(within(panel).getByText("Failed:")).toBeVisible();
    expect(within(panel).getByText("Unexpected token")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Challenge not passed. 0 of 1 test passed. Failed: Execution.",
    );
  });
});

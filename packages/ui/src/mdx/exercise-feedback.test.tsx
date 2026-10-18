import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Exercise, ExerciseDataProvider, type ExerciseData } from "./exercise";
import { parseAndRunTests, type TestRunOutcome } from "./exercise-runner";

const editor = vi.hoisted(() => ({ code: "const answer = 0;" }));

vi.mock("../use-scheme", () => ({ useScheme: () => "dark" }));
vi.mock("./exercise-runner", () => ({ parseAndRunTests: vi.fn() }));
vi.mock("@codesandbox/sandpack-react", () => ({
  SandpackProvider: ({ children }: { children: React.ReactNode }) => children,
  SandpackCodeEditor: () => null,
  useSandpack: () => ({
    sandpack: {
      files: { "/index.js": { code: editor.code } },
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
  editor.code = exercise.starterCode;
  vi.mocked(parseAndRunTests).mockReset();
});

function pendingRun() {
  let resolve!: (value: TestRunOutcome) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<TestRunOutcome>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const successfulOutput: TestRunOutcome = {
  results: [{ name: "readings match", passed: true }],
  logs: [],
  artifacts: [{ kind: "text", title: "Returned readings", text: "2, 3, 5" }],
};

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

  it("discards a pending run after Reset without unlocking or replacing a newer run", async () => {
    const first = pendingRun(),
      second = pendingRun(),
      onSubmit = vi.fn();
    vi.mocked(parseAndRunTests)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <Exercise slug={exercise.slug} onSubmit={onSubmit} />
      </ExerciseDataProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await act(async () => first.resolve(successfulOutput));
    expect(
      screen.queryByRole("region", { name: "Output from your code" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("test-results-panel")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Running|Downloading TFJS/ }),
    ).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
    await act(async () => second.resolve(successfulOutput));
    expect(
      screen.getByRole("heading", { name: "Returned readings" }),
    ).toBeVisible();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it.each(["exercise", "account"])(
    "discards a pending run when the %s changes, even if its code is identical",
    async (scope) => {
      const pending = pendingRun(),
        onSubmit = vi.fn();
      const next = { ...exercise, slug: "next-exercise" };
      vi.mocked(parseAndRunTests).mockReturnValue(pending.promise);
      const tree = (slug: string, owner: string) => (
        <ExerciseDataProvider
          exercises={
            new Map([
              [exercise.slug, exercise],
              [next.slug, next],
            ])
          }
        >
          <Exercise slug={slug} draftOwner={owner} onSubmit={onSubmit} />
        </ExerciseDataProvider>
      );
      const { rerender } = render(tree(exercise.slug, "first-account"));
      fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
      rerender(
        tree(
          scope === "exercise" ? next.slug : exercise.slug,
          scope === "account" ? "second-account" : "first-account",
        ),
      );
      await screen.findByRole("button", { name: "Run Tests" });
      await act(async () => pending.resolve(successfulOutput));
      expect(
        screen.queryByRole("region", { name: "Output from your code" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("test-results-panel"),
      ).not.toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it("preserves a run's output as stale when the learner edits during execution", async () => {
    const pending = pendingRun();
    vi.mocked(parseAndRunTests).mockReturnValue(pending.promise);
    const tree = (
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <Exercise slug={exercise.slug} />
      </ExerciseDataProvider>
    );
    const { rerender } = render(tree);
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    editor.code = "const answer = 2;";
    rerender(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <Exercise slug={exercise.slug} />
      </ExerciseDataProvider>,
    );
    await act(async () => pending.resolve(successfulOutput));
    const output = screen.getByRole("region", {
      name: "Output from your code",
    });
    expect(within(output).getByRole("status")).toHaveTextContent(
      "Your code has changed. Run it again to update these results.",
    );
    expect(within(output).getByText("2, 3, 5")).toBeVisible();
    expect(screen.queryByTestId("test-results-panel")).not.toBeInTheDocument();
  });

  it("does not restore a failed run or record an attempt after Reset", async () => {
    const pending = pendingRun(),
      onSubmit = vi.fn();
    vi.mocked(parseAndRunTests).mockReturnValue(pending.promise);
    render(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <Exercise slug={exercise.slug} onSubmit={onSubmit} />
      </ExerciseDataProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await act(async () => pending.reject(new Error("Old failure")));
    expect(screen.queryByText("Old failure")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("explains a legacy draft without replacing the learner's work", async () => {
    localStorage.setItem(
      `tc-code-${exercise.slug}`,
      "const oldReadings = [2, 3, 5];",
    );
    renderExercise();
    expect(
      await screen.findByText(
        "This saved draft predates the current starter. Compare it with the current instructions or use Reset.",
      ),
    ).toBeVisible();
    expect(localStorage.getItem(`tc-code-${exercise.slug}`)).toBe(
      "const oldReadings = [2, 3, 5];",
    );
  });

  it("gives a useful workspace prompt when no reference tensor is supplied", async () => {
    render(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <Exercise slug={exercise.slug} workspace />
      </ExerciseDataProvider>,
    );
    const checks = screen.getByRole("complementary", { name: "Test results" });
    expect(
      within(checks).getByText(
        "Run Tests to see your result and check your code.",
      ),
    ).toBeVisible();
  });

  it.each(["exercise", "account"])(
    "keeps a revealed solution within its %s scope and restores that scope's saved assistance",
    async (scope) => {
      const next = { ...exercise, slug: "next-exercise" },
        onSubmit = vi.fn();
      vi.mocked(parseAndRunTests).mockResolvedValue(successfulOutput);
      const tree = (slug: string, owner: string) => (
        <ExerciseDataProvider
          exercises={
            new Map([
              [exercise.slug, exercise],
              [next.slug, next],
            ])
          }
        >
          <Exercise slug={slug} draftOwner={owner} onSubmit={onSubmit} />
        </ExerciseDataProvider>
      );
      const { rerender } = render(tree(exercise.slug, "first-account"));
      fireEvent.click(
        await screen.findByRole("button", { name: "Show Solution" }),
      );
      expect(
        screen.getByText(
          "Solution revealed. Try changing it and re-running the tests.",
        ),
      ).toBeVisible();
      const nextSlug = scope === "exercise" ? next.slug : exercise.slug;
      const nextOwner =
        scope === "account" ? "second-account" : "first-account";
      rerender(tree(nextSlug, nextOwner));
      expect(
        await screen.findByRole("button", { name: "Show Solution" }),
      ).toBeVisible();
      expect(
        screen.queryByText(
          "Solution revealed. Try changing it and re-running the tests.",
        ),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Run Tests" }));
      await screen.findByRole("heading", { name: "Returned readings" });
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseSlug: nextSlug,
          solutionViewed: false,
        }),
      );

      rerender(tree(exercise.slug, "first-account"));
      expect(
        await screen.findByText(
          "Solution revealed. Try changing it and re-running the tests.",
        ),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Show Solution" }),
      ).not.toBeInTheDocument();
    },
  );
});

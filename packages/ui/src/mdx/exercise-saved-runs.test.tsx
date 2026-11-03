import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Exercise,
  ExerciseDataProvider,
  type ExerciseData,
  type ExerciseProps,
} from "./exercise";
import { parseAndRunTests, type TestRunOutcome } from "./exercise-runner";
import { markExerciseSolutionViewed } from "./exercise-draft";

vi.mock("../use-scheme", () => ({ useScheme: () => "dark" }));
vi.mock("./exercise-runner", () => ({ parseAndRunTests: vi.fn() }));
vi.mock("@codesandbox/sandpack-react", async () => {
  const React = await import("react");
  const Context = React.createContext({
    code: "",
    update: (_code: string) => {},
  });
  return {
    SandpackProvider: ({
      children,
      files,
    }: {
      children: React.ReactNode;
      files: Record<string, { code: string }>;
    }) => {
      const [code, update] = React.useState(files["/index.js"].code);
      return (
        <Context.Provider value={{ code, update }}>{children}</Context.Provider>
      );
    },
    SandpackCodeEditor: () => {
      const { code, update } = React.useContext(Context);
      return (
        <textarea
          aria-label="Code"
          value={code}
          onChange={(e) => update(e.target.value)}
        />
      );
    },
    useSandpack: () => {
      const { code, update } = React.useContext(Context);
      return {
        sandpack: {
          files: { "/index.js": { code } },
          updateFile: (_path: string, next: string) => update(next),
        },
      };
    },
  };
});

const exercise: ExerciseData = {
  slug: "saved-run",
  title: "Scaled readings",
  instructions: "Scale each column.",
  starterCode: "const value = 0;",
  solutionCode: "const value = 1;",
  testCode: "hidden checks",
  estimatedMinutes: 2,
  difficulty: "beginner",
};
const passed: TestRunOutcome = {
  results: [{ name: "scaled", passed: true }],
  logs: [],
  artifacts: [{ kind: "text", title: "Reading", text: "1" }],
  runtimeVersion: "4.22.0",
  backend: "cpu",
};
function tree(props: Partial<ExerciseProps> = {}) {
  return (
    <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
      <Exercise
        slug={exercise.slug}
        {...props}
        renderSavedRuns={({ restore }) => (
          <button onClick={() => restore("const value = 3;", true)}>
            Restore saved test run
          </button>
        )}
      />
    </ExerciseDataProvider>
  );
}
function pending() {
  let resolve!: (value: TestRunOutcome) => void;
  const promise = new Promise<TestRunOutcome>((done) => {
    resolve = done;
  });
  return { resolve, promise };
}
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.mocked(parseAndRunTests).mockReset().mockResolvedValue(passed);
});

describe("saved exercise runs", () => {
  it("captures external lesson hints and retains prior solution exposure for its owner", async () => {
    const onRunSnapshot = vi.fn();
    markExerciseSolutionViewed(exercise.slug, "one");
    const view = render(
      tree({ draftOwner: "one", onRunSnapshot, getHintLevels: () => [1, 2] }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await waitFor(() => expect(onRunSnapshot).toHaveBeenCalledOnce());
    expect(onRunSnapshot.mock.calls[0][0].assistance).toEqual({
      solutionViewed: true,
      hintsRevealed: [1, 2],
      hintHistory: "session-only",
    });
    view.rerender(tree({ draftOwner: "two", onRunSnapshot }));
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await waitFor(() => expect(onRunSnapshot).toHaveBeenCalledTimes(2));
    expect(onRunSnapshot.mock.calls[1][0].assistance.solutionViewed).toBe(
      false,
    );
  });

  it("exposes the recovery copy if the browser cannot write the recovered draft", async () => {
    render(tree());
    await screen.findByRole("textbox", { name: "Code" });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore My Code" }));
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      "const value = 3;",
    );
    expect(
      screen.getByText(exercise.starterCode, { selector: "pre code" }),
    ).toBeVisible();
  });

  it("captures the submitted code and assistance at run start despite later edits", async () => {
    const run = pending(),
      onRunSnapshot = vi.fn();
    vi.mocked(parseAndRunTests).mockReturnValue(run.promise);
    render(tree({ onRunSnapshot }));
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Solution" }));
    await act(async () => run.resolve(passed));
    expect(onRunSnapshot).toHaveBeenCalledOnce();
    expect(onRunSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        submittedCode: exercise.starterCode,
        starterCode: exercise.starterCode,
        testCode: exercise.testCode,
        artifacts: passed.artifacts,
        checks: passed.results,
        runtimeVersion: "4.22.0",
        backend: "cpu",
        errored: false,
        assistance: {
          solutionViewed: false,
          hintsRevealed: [],
          hintHistory: "session-only",
        },
      }),
    );
    expect(
      screen.getByText(
        "Your code has changed. Run it again to update these results.",
      ),
    ).toBeVisible();
  });

  it.each(["reset", "unmount", "account", "restore"])(
    "discards pending snapshots after %s",
    async (action) => {
      const run = pending(),
        onRunSnapshot = vi.fn();
      vi.mocked(parseAndRunTests).mockReturnValue(run.promise);
      const view = render(tree({ onRunSnapshot, draftOwner: "one" }));
      fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
      if (action === "reset")
        fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      if (action === "unmount") view.unmount();
      if (action === "account")
        view.rerender(tree({ onRunSnapshot, draftOwner: "two" }));
      if (action === "restore")
        fireEvent.click(
          screen.getByRole("button", { name: "Restore saved test run" }),
        );
      await act(async () => run.resolve(passed));
      expect(onRunSnapshot).not.toHaveBeenCalled();
    },
  );

  it("preserves newer code across restore and reload with its solution provenance", async () => {
    const onRunSnapshot = vi.fn();
    const view = render(tree({ onRunSnapshot }));
    const code = await screen.findByRole("textbox", { name: "Code" });
    fireEvent.change(code, { target: { value: "const newer = 9;" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    expect(code).toHaveValue("const value = 3;");
    expect(
      JSON.parse(localStorage.getItem("tc-code-saved-run")!),
    ).toMatchObject({
      code: "const value = 3;",
      stashedCode: "const newer = 9;",
      solutionViewed: true,
    });
    view.unmount();
    render(tree({ onRunSnapshot }));
    expect(await screen.findByRole("textbox", { name: "Code" })).toHaveValue(
      "const value = 3;",
    );
    fireEvent.click(screen.getByRole("button", { name: "Restore My Code" }));
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      "const newer = 9;",
    );
    fireEvent.click(screen.getByRole("button", { name: "Run Tests" }));
    await waitFor(() => expect(onRunSnapshot).toHaveBeenCalledOnce());
    expect(onRunSnapshot.mock.calls[0][0].assistance.solutionViewed).toBe(true);
  });

  it("refuses to overwrite a draft when recovery storage fails", async () => {
    render(tree());
    const code = await screen.findByRole("textbox", { name: "Code" });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    expect(code).toHaveValue(exercise.starterCode);
    expect(
      screen.getByText(/could not preserve your current draft/),
    ).toBeVisible();
  });

  it("retains solution-rung exposure after reopening the draft", async () => {
    const onRunSnapshot = vi.fn();
    const withHint = {
      ...exercise,
      hints: [
        { level: "solution" as const, content: "Use the supplied solution." },
      ],
    };
    const view = render(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, withHint]])}>
        <Exercise slug={exercise.slug} onRunSnapshot={onRunSnapshot} />
      </ExerciseDataProvider>,
    );
    await screen.findByRole("textbox", { name: "Code" });
    fireEvent.click(screen.getByRole("button", { name: "Reveal Solution" }));
    view.unmount();
    render(tree({ onRunSnapshot }));
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await waitFor(() => expect(onRunSnapshot).toHaveBeenCalledOnce());
    expect(onRunSnapshot.mock.calls[0][0].assistance).toEqual({
      solutionViewed: true,
      hintsRevealed: [],
      hintHistory: "session-only",
    });
  });

  it("keeps the recovery copy when another saved run would overwrite it", async () => {
    render(tree());
    const code = await screen.findByRole("textbox", { name: "Code" });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    fireEvent.change(code, { target: { value: "const moreChanges = 2;" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    expect(code).toHaveValue("const moreChanges = 2;");
    expect(
      screen.getByText(/Use Restore My Code before restoring another run/),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Restore My Code" }));
    fireEvent(window, new Event("pagehide"));
    expect(JSON.parse(localStorage.getItem("tc-code-saved-run")!).code).toBe(
      exercise.starterCode,
    );
  });

  it("keeps partial artifacts and failed checks together", async () => {
    const onRunSnapshot = vi.fn();
    const partial = {
      ...passed,
      results: [
        ...passed.results,
        { name: "new reading", passed: false, error: "Reuse the saved mean." },
      ],
    };
    vi.mocked(parseAndRunTests).mockResolvedValue(partial);
    render(tree({ onRunSnapshot }));
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await waitFor(() => expect(onRunSnapshot).toHaveBeenCalledOnce());
    expect(onRunSnapshot.mock.calls[0][0]).toMatchObject({
      artifacts: partial.artifacts,
      checks: partial.results,
      errored: false,
    });
  });
});

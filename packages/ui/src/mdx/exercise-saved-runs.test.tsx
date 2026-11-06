import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import {
  Exercise,
  ExerciseDataProvider,
  type ExerciseData,
  type ExerciseProps,
  type ExerciseResultContext,
  type ExerciseRunEvent,
  type ExerciseSavedRunsContext,
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
        renderSavedRuns={
          props.renderSavedRuns ??
          (({ restore, restoreAvailable }) => (
            <button
              disabled={restoreAvailable === false}
              onClick={() => restore("const value = 3;", true)}
            >
              Restore saved test run
            </button>
          ))
        }
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

describe("exercise result lifecycle", () => {
  function inspector(context: ExerciseResultContext) {
    return (
      <section aria-label="Inspected result">
        <p>{context.attempt.status}</p>
        <p data-testid="inspector-code">{context.currentCode}</p>
        <a href={`#${context.editorId}`}>Return to code</a>
      </section>
    );
  }

  it("publishes one immutable snapshot and places history after the result with one editor", async () => {
    const task = pending();
    vi.mocked(parseAndRunTests).mockReturnValue(task.promise);
    const events: ExerciseRunEvent[] = [];
    const snapshots = vi.fn();
    const submit = vi.fn();
    render(
      tree({
        renderResult: inspector,
        onRunLifecycle: (event) => events.push(event),
        onRunSnapshot: snapshots,
        onSubmit: submit,
      }),
    );
    const button = await screen.findByRole("button", { name: "Run Tests" });
    button.focus();
    fireEvent.click(button);
    expect(events[0]).toMatchObject({ type: "started" });
    expect(
      screen.getByRole("region", { name: "Inspected result" }),
    ).toHaveTextContent("running");
    await act(async () => task.resolve(passed));
    expect(events.map((event) => event.type)).toEqual(["started", "captured"]);
    const captured = events[1];
    if (captured?.type !== "captured" || events[0]?.type !== "started")
      throw new Error("Missing run events");
    expect(captured.runToken).toBe(events[0].runToken);
    expect(Object.isFrozen(captured.snapshot)).toBe(true);
    expect(Object.isFrozen(captured.snapshot.artifacts[0])).toBe(true);
    expect(captured.snapshot.artifacts).not.toBe(passed.artifacts);
    expect(snapshots).toHaveBeenCalledExactlyOnceWith(captured.snapshot);
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("textbox", { name: "Code" })).toHaveLength(1);
    const result = screen.getByRole("region", { name: "Inspected result" });
    const restore = screen.getByRole("button", {
      name: "Restore saved test run",
    });
    expect(
      result.compareDocumentPosition(restore) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("status")).toHaveTextContent("All 1 test passed");
    expect(button).toHaveFocus();
    const inspect = screen.getByRole("link", { name: "Inspect result" });
    expect(result.parentElement).toHaveAttribute(
      "id",
      inspect.getAttribute("href")!.slice(1),
    );
  });

  it("keeps submitted code and current editor code distinct after an edit during execution", async () => {
    const task = pending();
    vi.mocked(parseAndRunTests).mockReturnValue(task.promise);
    const contexts: ExerciseResultContext[] = [];
    render(
      tree({
        renderResult: (context) => {
          contexts.push(context);
          return inspector(context);
        },
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Code" }), {
      target: { value: "const later = 2;" },
    });
    await act(async () => task.resolve(passed));
    const context = contexts.at(-1)!;
    expect(context.currentCode).toBe("const later = 2;");
    expect(context.attempt).toMatchObject({
      status: "settled",
      snapshot: { submittedCode: exercise.starterCode },
    });
    expect(screen.getByTestId("exercise-result-verdict")).toHaveTextContent(
      "These checks belong to the submitted code",
    );
  });

  it("invalidates a pending run on reset and accepts only the newer run token", async () => {
    const first = pending(),
      second = pending();
    vi.mocked(parseAndRunTests)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const events: ExerciseRunEvent[] = [];
    const snapshots = vi.fn();
    render(
      tree({
        renderResult: inspector,
        onRunLifecycle: (event) => events.push(event),
        onRunSnapshot: snapshots,
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(events[1]).toEqual({ type: "invalidated", reason: "reset" });
    fireEvent.click(screen.getByRole("button", { name: "Run Tests" }));
    await act(async () => first.resolve(passed));
    expect(snapshots).not.toHaveBeenCalled();
    expect(
      screen.getByRole("region", { name: "Inspected result" }),
    ).toHaveTextContent("running");
    await act(async () => second.resolve(passed));
    expect(events.map((event) => event.type)).toEqual([
      "started",
      "invalidated",
      "started",
      "captured",
    ]);
    expect(events[0]).not.toEqual(events[2]);
    expect(snapshots).toHaveBeenCalledOnce();
  });

  it("clears an already completed raw attempt immediately on reset", async () => {
    const events: ExerciseRunEvent[] = [];
    render(
      tree({
        renderResult: inspector,
        onRunLifecycle: (event) => events.push(event),
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await screen.findByText("settled");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(
      screen.getByRole("region", { name: "Inspected result" }),
    ).toHaveTextContent("idle");
    expect(
      screen.queryByTestId("exercise-result-verdict"),
    ).not.toBeInTheDocument();
    expect(events.at(-1)).toEqual({ type: "invalidated", reason: "reset" });
  });

  it("preserves the latest draft before restore invalidates a run", async () => {
    const task = pending();
    vi.mocked(parseAndRunTests).mockReturnValue(task.promise);
    const snapshots = vi.fn();
    const events: ExerciseRunEvent[] = [];
    let recoveryAtInvalidation: unknown;
    render(
      tree({
        renderResult: inspector,
        onRunSnapshot: snapshots,
        onRunLifecycle: (event) => {
          events.push(event);
          if (event.type === "invalidated" && event.reason === "restore") {
            recoveryAtInvalidation = JSON.parse(
              localStorage.getItem("tc-code-saved-run")!,
            );
          }
        },
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Code" }), {
      target: { value: "const newer = 4;" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    expect(recoveryAtInvalidation).toMatchObject({
      code: "const value = 3;",
      stashedCode: "const newer = 4;",
    });
    expect(events.at(-1)).toEqual({ type: "invalidated", reason: "restore" });
    await act(async () => task.resolve(passed));
    expect(snapshots).not.toHaveBeenCalled();
  });

  it("leaves a running attempt active when preserving its draft fails", async () => {
    const task = pending();
    vi.mocked(parseAndRunTests).mockReturnValue(task.promise);
    const events: ExerciseRunEvent[] = [];
    render(
      tree({
        renderResult: inspector,
        onRunLifecycle: (event) => events.push(event),
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    expect(events.map((event) => event.type)).toEqual(["started"]);
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      exercise.starterCode,
    );
    await act(async () => task.resolve(passed));
    expect(events.at(-1)?.type).toBe("captured");
  });

  it("rejects an old restore command after leaving and returning to the same owner scope", async () => {
    let oldRestore: ExerciseSavedRunsContext["restore"] | undefined;
    const events: ExerciseRunEvent[] = [];
    const props = {
      renderResult: inspector,
      onRunLifecycle: (event: ExerciseRunEvent) => events.push(event),
      renderSavedRuns: (context: ExerciseSavedRunsContext) => {
        if (context.restoreAvailable && !oldRestore)
          oldRestore = context.restore;
        return null;
      },
    };
    const view = render(tree({ ...props, draftOwner: "one" }));
    await waitFor(() => expect(oldRestore).toBeDefined());
    view.rerender(tree({ ...props, draftOwner: "two" }));
    await screen.findByRole("textbox", { name: "Code" });
    expect(oldRestore!("old owner's code", false)).toBe(false);
    view.rerender(tree({ ...props, draftOwner: "one" }));
    await screen.findByRole("textbox", { name: "Code" });
    expect(oldRestore!("old instance code", false)).toBe(false);
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      exercise.starterCode,
    );
    expect(events.filter((event) => event.type === "invalidated")).toEqual([
      { type: "invalidated", reason: "scope-change" },
      { type: "invalidated", reason: "scope-change" },
    ]);
  });

  it("keeps current registration usable under effect cleanup and rejects commands after unmount", async () => {
    let latest: ExerciseSavedRunsContext | undefined;
    const availability: (boolean | undefined)[] = [];
    const view = render(
      <StrictMode>
        {tree({
          renderSavedRuns: (context) => {
            latest = context;
            availability.push(context.restoreAvailable);
            return null;
          },
        })}
      </StrictMode>,
    );
    await waitFor(() => expect(latest?.restoreAvailable).toBe(true));
    expect(availability).toContain(false);
    expect(latest!.restore(exercise.starterCode, false)).toBe(true);
    const oldRestore = latest!.restore;
    view.unmount();
    render(tree());
    await screen.findByRole("textbox", { name: "Code" });
    expect(oldRestore("stale code", false)).toBe(false);
    fireEvent.click(
      screen.getByRole("button", { name: "Restore saved test run" }),
    );
    expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
      "const value = 3;",
    );
  });

  it("keeps fallback output and grading when host callbacks throw", async () => {
    const snapshot = vi.fn(() => {
      throw new Error("host snapshot failed");
    });
    const lifecycle = vi.fn(() => {
      throw new Error("host lifecycle failed");
    });
    const submit = vi.fn();
    render(
      tree({
        renderResult: () => undefined,
        onRunSnapshot: snapshot,
        onRunLifecycle: lifecycle,
        onSubmit: submit,
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Run Tests" }));
    await screen.findByRole("heading", { name: "Reading" });
    expect(snapshot).toHaveBeenCalledOnce();
    expect(lifecycle).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.getByTestId("test-results-panel")).toHaveTextContent(
      "passed",
    );
  });
});

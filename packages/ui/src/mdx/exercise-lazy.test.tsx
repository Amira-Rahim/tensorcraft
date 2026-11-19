import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Exercise,
  ExerciseDataProvider,
  type ExerciseData,
} from "@tensorcraft/ui";
import { parseAndRunTests } from "./exercise-runner";

const evaluated = vi.hoisted(() => ({
  sandpack: vi.fn(),
  codemirror: vi.fn(),
}));

vi.mock("../use-scheme", () => ({ useScheme: () => "dark" }));
vi.mock("./exercise-runner", () => ({ parseAndRunTests: vi.fn() }));
vi.mock("@codemirror/view", async (importOriginal) => {
  evaluated.codemirror();
  return importOriginal();
});
vi.mock("@codesandbox/sandpack-react", async () => {
  evaluated.sandpack();
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
          onChange={(event) => update(event.target.value)}
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
  slug: "lazy-boundary",
  title: "Grouped readings",
  instructions: "Keep the selected sensor readings together.",
  starterCode: "const value = 0;",
  solutionCode: "const value = 1;",
  testCode: "hidden checks",
  estimatedMinutes: 2,
  difficulty: "beginner",
};

describe("public Exercise loading boundary", () => {
  it("keeps the briefing free of editor evaluation and loads the working pane with host callbacks intact", async () => {
    localStorage.clear();
    vi.mocked(parseAndRunTests).mockResolvedValue({
      results: [{ name: "readings match", passed: true }],
      logs: [],
      artifacts: [{ kind: "text", title: "Reading", text: "1" }],
      runtimeVersion: "4.22.0",
      backend: "cpu",
    });
    const onSubmit = vi.fn();
    const onRunSnapshot = vi.fn();
    const onRunLifecycle = vi.fn();
    const view = render(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <p>Briefing and reading</p>
      </ExerciseDataProvider>,
    );
    expect(screen.getByText("Briefing and reading")).toBeVisible();
    expect(evaluated.sandpack).not.toHaveBeenCalled();
    expect(evaluated.codemirror).not.toHaveBeenCalled();

    view.rerender(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <Exercise
          slug={exercise.slug}
          draftOwner="account-a"
          onSubmit={onSubmit}
          onRunSnapshot={onRunSnapshot}
          onRunLifecycle={onRunLifecycle}
          getHintLevels={() => [1]}
          brief="external"
          editorHeading="Selected readings"
          renderResult={({ attempt }) => (
            <p data-testid="host-result">{attempt.status}</p>
          )}
          renderSavedRuns={({ restore }) => (
            <button
              type="button"
              onClick={() => restore("const value = 2;", false)}
            >
              Restore recorded code
            </button>
          )}
        />
      </ExerciseDataProvider>,
    );
    expect(screen.getByText("Loading editor…")).toBeVisible();
    const run = await screen.findByRole("button", { name: "Run Tests" });
    expect(evaluated.sandpack).toHaveBeenCalledOnce();
    expect(evaluated.codemirror).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Selected readings" }),
    ).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Code" }), {
      target: { value: "const value = 1;" },
    });
    await act(async () => {
      fireEvent.click(run);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        exerciseSlug: exercise.slug,
        passed: true,
        code: "const value = 1;",
      }),
    );
    expect(onRunSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        submittedCode: "const value = 1;",
        assistance: expect.objectContaining({ hintsRevealed: [1] }),
      }),
    );
    expect(onRunLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ type: "started" }),
    );
    expect(onRunLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ type: "captured" }),
    );
    expect(screen.getByTestId("host-result")).toHaveTextContent("settled");
    fireEvent.click(
      screen.getByRole("button", { name: "Restore recorded code" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Code" })).toHaveValue(
        "const value = 2;",
      ),
    );
    expect(onRunLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ type: "invalidated", reason: "restore" }),
    );
    expect(screen.getByTestId("host-result")).toHaveTextContent("idle");
  });
});

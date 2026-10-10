import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StopScan } from "@tensorcraft/shared";
import { finishHeading, TaskStopsBrief } from "./task-stops-brief";
import type { TaskStep, TaskStopsSnapshot, TaskStopsStore } from "./task-stops";

const here = path.dirname(fileURLToPath(import.meta.url));

const STEPS: TaskStep[] = [
  {
    title: "Create the tensor",
    instruction: "Set `reading` to:",
    code: "tf.tensor(streamValues)",
    target: "reading",
    line: 3,
  },
  {
    title: "Read its shape",
    instruction: "Set `shape` to:",
    code: "reading.shape",
    result: "Expect `[5]`: a list of five readings.",
    target: "shape",
    line: 4,
  },
];
const BRIEF = {
  steps: STEPS,
  support:
    "TensorFlow.js is loaded as `tf`. Leave the other lines as they are.",
};

function fakeStore(initial: TaskStopsSnapshot) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    select: vi.fn(),
    set(next: TaskStopsSnapshot) {
      snapshot = next;
      for (const listener of listeners) listener();
    },
  } satisfies TaskStopsStore & { set(next: TaskStopsSnapshot): void };
}
const scan = (line: number | null, state: StopScan["state"]): StopScan => ({
  line,
  state,
  rhsStart: 0,
  rhsEnd: 0,
  matches: line === null ? 0 : 1,
});

describe("finishHeading", () => {
  it("names one, two and more lines, sorted and de-duplicated", () => {
    expect(finishHeading([3])).toBe("Finish line 3");
    expect(finishHeading([4, 3])).toBe("Finish lines 3 and 4");
    expect(finishHeading([8, 3, 5, 5])).toBe("Finish lines 3, 5 and 8");
    expect(finishHeading([4, 4])).toBe("Finish line 4");
  });
});

describe("TaskStopsBrief (spec 2026-10-10)", () => {
  it("shows build-time lines and inert keys until the editor attaches", () => {
    const store = fakeStore({ attached: false, scans: [] });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Finish lines 3 and 4",
    );
    const key = screen.getByRole("button", { name: "Line 3" });
    expect(key).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(key);
    expect(store.select).not.toHaveBeenCalled();
  });

  it("follows the editor's line numbers once attached", () => {
    const store = fakeStore({ attached: false, scans: [] });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    act(() =>
      store.set({
        attached: true,
        scans: [scan(4, "waiting"), scan(5, "waiting")],
      }),
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Finish lines 4 and 5",
    );
    expect(screen.getByRole("button", { name: "Line 4" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("selects a stop through the store; each key is described by its title", () => {
    const store = fakeStore({
      attached: true,
      scans: [scan(3, "waiting"), scan(4, "waiting")],
    });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    const key = screen.getByRole("button", { name: "Line 4" });
    expect(key).toHaveAccessibleDescription("Read its shape");
    fireEvent.click(key);
    expect(store.select).toHaveBeenCalledWith(1);
  });

  it("quiets a typed stop and says so to screen readers", () => {
    const store = fakeStore({
      attached: true,
      scans: [scan(3, "typed"), scan(4, "waiting")],
    });
    const { container } = render(
      <TaskStopsBrief brief={BRIEF} store={store} />,
    );
    const items = container.querySelectorAll(".challenge-stops > li");
    expect(items[0]).toHaveAttribute("data-stop-state", "typed");
    expect(items[1]).toHaveAttribute("data-stop-state", "waiting");
    expect(
      screen.getByRole("button", { name: "Line 3" }),
    ).toHaveAccessibleDescription("Create the tensor, typed");
  });

  it("keeps a missing stop on its build-time line", () => {
    const store = fakeStore({
      attached: true,
      scans: [scan(2, "waiting"), scan(null, "missing")],
    });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Finish lines 2 and 4",
    );
  });

  it("prints the code to type, the note and the result", () => {
    const store = fakeStore({ attached: false, scans: [] });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    expect(screen.getByText("tf.tensor(streamValues)")).toBeInTheDocument();
    expect(screen.getByText("reading.shape")).toBeInTheDocument();
    expect(screen.getByText(/a list of five readings/)).toBeInTheDocument();
    expect(screen.getByText(/is loaded as/)).toBeInTheDocument();
    expect(screen.getByTestId("exercise-brief")).toHaveClass("challenge-brief");
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const store = fakeStore({ attached: false, scans: [] });
    const { container } = render(
      <TaskStopsBrief brief={BRIEF} store={store} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("loads no CodeMirror: it imports only types from task-stops", () => {
    const src = fs.readFileSync(
      path.join(here, "task-stops-brief.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/^import [^\n]*@codemirror/m);
    expect(src).toMatch(/^import type \{[^}]*\} from "\.\/task-stops";$/m);
  });
});

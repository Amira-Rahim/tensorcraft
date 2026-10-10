import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createTaskStopsStore,
  measureStops,
  taskStops,
  useTaskStops,
  type TaskStep,
} from "./task-stops";

// jsdom has no layout. CodeMirror's measure pass calls Range#getClientRects,
// which jsdom does not implement, and the throw lands in a later animation
// frame as an unhandled error that fails the run (probed 2026-10-10).
beforeAll(() => {
  Range.prototype.getClientRects = () =>
    Object.assign([], { item: () => null }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
});

const STARTER = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "// Your work: replace the two nulls.",
  "const reading = null;",
  "const shape = null;",
  "// Supplied: copy the readings into a JavaScript array for Farah.",
  "const values = reading?.arraySync();",
  "// Supplied: release memory after copying the values.",
  "reading?.dispose();",
  "",
].join("\n");
const SOLUTION = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "const reading = tf.tensor(streamValues);",
  "const shape = reading.shape;",
  "const values = reading.arraySync();",
  "reading?.dispose();",
].join("\n");
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
    target: "shape",
    line: 4,
  },
];

const views: EditorView[] = [];
afterEach(() => {
  for (const view of views.splice(0)) view.destroy();
});
function mount(doc: string) {
  const store = createTaskStopsStore(STEPS);
  const view = new EditorView({
    state: EditorState.create({ doc, extensions: [taskStops(STEPS, store)] }),
    parent: document.body,
  });
  views.push(view);
  return { store, view };
}
const docOf = (code: string) => EditorState.create({ doc: code }).doc;

describe("measureStops (spec 2026-10-10, section 4 table)", () => {
  it("frames each waiting null and marks its line", () => {
    const doc = docOf(STARTER);
    const value = measureStops(doc, STEPS);
    const framed: string[] = [];
    value.slots.between(0, doc.length, (from, to) => {
      framed.push(doc.sliceString(from, to));
    });
    const marked: number[] = [];
    value.lines.between(0, doc.length, (from) => {
      marked.push(doc.lineAt(from).number);
    });
    expect(framed).toEqual(["null", "null"]);
    expect(marked).toEqual([3, 4]);
  });

  it("keeps the line mark for other code and drops both marks once typed", () => {
    const doc = docOf(
      STARTER.replace(
        "const reading = null;",
        "const reading = tf.tensor1d(streamValues);",
      ).replace("const shape = null;", "const shape = reading.shape;"),
    );
    const value = measureStops(doc, STEPS);
    expect(value.scans.map((scan) => scan.state)).toEqual(["other", "typed"]);
    expect(value.slots.size).toBe(0);
    const marked: number[] = [];
    value.lines.between(0, doc.length, (from) => {
      marked.push(doc.lineAt(from).number);
    });
    expect(marked).toEqual([3]);
  });
});

describe("taskStops in an editor", () => {
  it("publishes the starter's stops when the view attaches", () => {
    const { store } = mount(STARTER);
    expect(store.getSnapshot().attached).toBe(true);
    expect(store.getSnapshot().scans.map((scan) => scan.line)).toEqual([3, 4]);
  });

  it("recomputes after a whole-document replace, as Reset and Show Solution send", () => {
    const { store, view } = mount(STARTER);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: SOLUTION },
    });
    expect(store.getSnapshot().scans).toMatchObject([
      { line: 2, state: "typed" },
      { line: 3, state: "typed" },
    ]);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: STARTER },
    });
    expect(store.getSnapshot().scans).toMatchObject([
      { line: 3, state: "waiting" },
      { line: 4, state: "waiting" },
    ]);
  });

  it("selects the waiting null and focuses the editor", () => {
    const { store, view } = mount(STARTER);
    store.select(0);
    const { from, to } = view.state.selection.main;
    expect(view.state.sliceDoc(from, to)).toBe("null");
    expect(view.hasFocus).toBe(true);
  });

  it("selects the right-hand side of a typed line", () => {
    const { store, view } = mount(
      STARTER.replace(
        "const reading = null;",
        "const reading = tf.tensor(streamValues);",
      ),
    );
    store.select(0);
    const { from, to } = view.state.selection.main;
    expect(view.state.sliceDoc(from, to)).toBe("tf.tensor(streamValues)");
  });

  it("puts the caret on the build-time line, clamped, when a declaration is missing", () => {
    const { store, view } = mount("// My tensor draft\nconst reading = null;");
    store.select(1);
    const { from, to } = view.state.selection.main;
    expect(from).toBe(to);
    expect(view.state.doc.lineAt(from).number).toBe(2);
  });

  it("detaches only when the view it holds is destroyed", () => {
    const store = createTaskStopsStore(STEPS);
    const make = () =>
      new EditorView({
        state: EditorState.create({
          doc: STARTER,
          extensions: [taskStops(STEPS, store)],
        }),
        parent: document.body,
      });
    const first = make();
    const second = make();
    first.destroy();
    expect(store.getSnapshot().attached).toBe(true);
    second.destroy();
    expect(store.getSnapshot().attached).toBe(false);
  });
});

describe("useTaskStops", () => {
  it("keeps one store and one extension array while the steps stay the same", () => {
    const { result, rerender } = renderHook(
      ({ steps }) => useTaskStops(steps),
      { initialProps: { steps: STEPS } },
    );
    const first = result.current;
    expect(first).not.toBeNull();
    rerender({ steps: STEPS });
    expect(result.current).toBe(first);
    rerender({ steps: [...STEPS] });
    expect(result.current).not.toBe(first);
  });

  it("returns null without steps", () => {
    const { result } = renderHook(() => useTaskStops(undefined));
    expect(result.current).toBeNull();
  });
});

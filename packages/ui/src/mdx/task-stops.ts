import { useMemo } from "react";
import {
  EditorSelection,
  RangeSet,
  StateField,
  type Extension,
  type Range,
  type Text,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  GutterMarker,
  ViewPlugin,
  gutterLineClass,
  type DecorationSet,
} from "@codemirror/view";
import { scanStops, type StopScan } from "@tensorcraft/shared";
import { EXERCISE_EDITOR_EXTENSIONS } from "./exercise-autocomplete";
import type { ExerciseData } from "./exercise";

/** One step of a challenge brief, as velite builds it. */
export type TaskStep = NonNullable<ExerciseData["taskBrief"]>["steps"][number];

export interface TaskStopsSnapshot {
  /** True while an editor is attached; until then the brief shows build-time lines. */
  attached: boolean;
  scans: readonly StopScan[];
}

/** What the brief may use: read the stops, and select one in the editor. */
export interface TaskStopsStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): TaskStopsSnapshot;
  select(index: number): void;
}

/** What the editor extension also needs. */
export interface TaskStopsWiring extends TaskStopsStore {
  attach(view: EditorView, scans: readonly StopScan[]): void;
  detach(view: EditorView): void;
  publish(scans: readonly StopScan[]): void;
}

function sameScans(a: readonly StopScan[], b: readonly StopScan[]): boolean {
  return (
    a.length === b.length &&
    a.every((scan, index) => {
      const other = b[index];
      return (
        scan.line === other.line &&
        scan.state === other.state &&
        scan.rhsStart === other.rhsStart &&
        scan.rhsEnd === other.rhsEnd &&
        scan.matches === other.matches
      );
    })
  );
}

export function createTaskStopsStore(
  steps: readonly TaskStep[],
): TaskStopsWiring {
  let view: EditorView | null = null;
  let snapshot: TaskStopsSnapshot = { attached: false, scans: [] };
  const listeners = new Set<() => void>();
  const emit = (next: TaskStopsSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    attach(next, scans) {
      view = next;
      emit({ attached: true, scans });
    },
    detach(old) {
      // Sandpack can build the next view before it destroys the old one.
      if (view !== old) return;
      view = null;
      emit({ attached: false, scans: snapshot.scans });
    },
    publish(scans) {
      if (sameScans(snapshot.scans, scans)) return;
      emit({ attached: view !== null, scans });
    },
    select(index) {
      const step = steps[index];
      if (!view || !step) return;
      const doc = view.state.doc;
      const scan = snapshot.scans[index];
      let anchor: number;
      let head: number;
      if (scan && scan.line !== null && scan.line <= doc.lines) {
        // A waiting placeholder IS the right-hand side; other and typed
        // code select what is there now.
        const line = doc.line(scan.line);
        anchor = line.from + scan.rhsStart;
        head = line.from + scan.rhsEnd;
      } else {
        // Missing: the build-time line, clamped to the document.
        anchor = head = doc.line(
          Math.min(Math.max(step.line, 1), doc.lines),
        ).from;
      }
      view.focus();
      view.dispatch({
        selection: EditorSelection.range(anchor, head),
        scrollIntoView: true,
      });
    },
  };
}

const slotMark = Decoration.mark({ class: "cm-task-slot" });

class TaskLineMarker extends GutterMarker {
  elementClass = "cm-task-line";
}
const taskLineMarker = new TaskLineMarker();

export interface MeasuredStops {
  scans: StopScan[];
  /** A frame on each waiting placeholder. */
  slots: DecorationSet;
  /** A gutter mark on each line still to finish: waiting or other code. */
  lines: RangeSet<GutterMarker>;
}

/** The marks for one document (spec 2026-10-10, section 4 table). */
export function measureStops(
  doc: Text,
  steps: readonly TaskStep[],
): MeasuredStops {
  const scans = scanStops(doc.toJSON(), steps);
  const slots: Range<Decoration>[] = [];
  const lines: Range<GutterMarker>[] = [];
  for (const scan of scans) {
    if (scan.line === null) continue;
    const line = doc.line(scan.line);
    if (scan.state === "waiting") {
      slots.push(
        slotMark.range(line.from + scan.rhsStart, line.from + scan.rhsEnd),
      );
    }
    if (scan.state === "waiting" || scan.state === "other") {
      lines.push(taskLineMarker.range(line.from));
    }
  }
  return {
    scans,
    slots: Decoration.set(slots, true),
    lines: RangeSet.of(lines, true),
  };
}

/**
 * Marks each stop's line in the editor and keeps the store in step. The
 * field recomputes from the document on every change instead of mapping old
 * positions: Sandpack's Reset, Show Solution and Restore My Code replace
 * the whole document, which drops mapped marks.
 */
export function taskStops(
  steps: readonly TaskStep[],
  store: TaskStopsWiring,
): Extension {
  const field = StateField.define<MeasuredStops>({
    create: (state) => measureStops(state.doc, steps),
    update: (value, transaction) =>
      transaction.docChanged
        ? measureStops(transaction.state.doc, steps)
        : value,
    provide: (self) => [
      EditorView.decorations.from(self, (value) => value.slots),
      gutterLineClass.from(self, (value) => value.lines),
    ],
  });
  const publisher = ViewPlugin.define((view) => {
    store.attach(view, view.state.field(field).scans);
    return {
      update(update) {
        const next = update.state.field(field);
        if (next !== update.startState.field(field, false)) {
          store.publish(next.scans);
        }
      },
      destroy() {
        store.detach(view);
      },
    };
  });
  return [field, publisher];
}

/**
 * The workspace's store and editor extensions, built once per step list.
 * Stable identity matters: sandpack-react 2.20.0's applyExtensions effect
 * appends the whole array again whenever it is not shallow-equal to the
 * previous one, which would stack a second copy of every extension. The
 * steps come from the page's exercise data, whose objects keep their
 * identity across renders.
 */
export function useTaskStops(steps: readonly TaskStep[] | undefined) {
  return useMemo(() => {
    if (!steps || steps.length === 0) return null;
    const store = createTaskStopsStore(steps);
    return {
      store: store as TaskStopsStore,
      extensions: [...EXERCISE_EDITOR_EXTENSIONS, taskStops(steps, store)],
    };
  }, [steps]);
}

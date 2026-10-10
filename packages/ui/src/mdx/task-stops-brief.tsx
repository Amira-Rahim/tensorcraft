"use client";

import { useId, useSyncExternalStore } from "react";
import { InstructionText } from "./instruction-text";
import type { TaskStep, TaskStopsStore } from "./task-stops";

export interface TaskStopsBriefData {
  steps: TaskStep[];
  support: string;
}

/** "Finish line 3", "Finish lines 3 and 4", "Finish lines 3, 5 and 8". */
export function finishHeading(lines: readonly number[]): string {
  const numbers = [...new Set(lines)].sort((a, b) => a - b);
  if (numbers.length === 1) return `Finish line ${numbers[0]}`;
  const last = numbers[numbers.length - 1];
  return `Finish lines ${numbers.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * The challenge workspace's brief: the lines to finish, as the head of the
 * editor column (spec 2026-10-10). Line numbers and states come from the
 * editor through the store once it attaches, and from the build until then.
 * A Missing stop keeps its build-time line (spec section 4).
 */
export function TaskStopsBrief({
  brief,
  store,
}: {
  brief: TaskStopsBriefData;
  store: TaskStopsStore;
}) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const id = useId();
  const stops = brief.steps.map((step, index) => {
    const scan = snapshot.attached ? snapshot.scans[index] : undefined;
    return {
      step,
      line: scan?.line ?? step.line,
      state: scan?.state ?? "waiting",
      titleId: `${id}-stop-${index}`,
    };
  });

  return (
    <section
      className="challenge-brief"
      data-testid="exercise-brief"
      aria-labelledby={`${id}-heading`}
    >
      <h3 id={`${id}-heading`}>{finishHeading(stops.map((s) => s.line))}</h3>
      <InstructionText text={brief.support} className="challenge-brief-note" />
      <ol className="challenge-stops" aria-label="Lines to finish">
        {stops.map(({ step, line, state, titleId }, index) => (
          <li key={step.target} data-stop-state={state}>
            <button
              type="button"
              className="challenge-stop-key"
              aria-describedby={titleId}
              aria-disabled={snapshot.attached ? undefined : true}
              onClick={() => {
                if (snapshot.attached) store.select(index);
              }}
            >
              Line {line}
            </button>
            <h4 id={titleId} className="challenge-stop-title">
              {step.title}
              {state === "typed" && <span className="sr-only">, typed</span>}
            </h4>
            <div className="challenge-stop-do">
              <InstructionText
                text={step.instruction}
                className="challenge-stop-instruction"
              />
              <code className="challenge-stop-code">{step.code}</code>
            </div>
            {step.result && (
              <InstructionText
                text={step.result}
                className="challenge-stop-result"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

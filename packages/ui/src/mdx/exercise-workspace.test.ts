import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "exercise.tsx"), "utf8");

describe("exercise pane, workspace wiring (spec 2026-10-10)", () => {
  it("right-aligns Show Solution and Restore My Code as one group for every exercise", () => {
    expect(src).toMatch(
      /data-help-group=""\s+className="ml-auto flex flex-wrap items-center gap-2"/,
    );
    const buttons =
      src.match(/data-solution-action=""[\s\S]*?className="[^"]*"/g) ?? [];
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button).not.toMatch(/\bml-auto\b/);
  });

  it("gives the editor the task-stops extensions when the workspace has a brief", () => {
    expect(src).toMatch(
      /extensions=\{taskStops\?\.extensions \?\? EXERCISE_EDITOR_EXTENSIONS\}/,
    );
  });

  it("renders the stops brief instead of the eyebrow row in the workspace", () => {
    expect(src).toMatch(/<TaskStopsBrief\s+brief=\{exercise\.taskBrief\}/);
    expect(src).toMatch(
      /\{taskStops && <h4 className="sr-only">Your JavaScript<\/h4>\}/,
    );
  });
});

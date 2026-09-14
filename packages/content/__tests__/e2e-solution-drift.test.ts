import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * The browser-worker e2e spec (e2e/exercise-run.spec.ts) types a canonical
 * solution into the editor and expects "All tests passed!". Playwright runs
 * outside the vitest and velite graph, so the spec cannot import the content
 * package: its solution and its lesson URL are hardcoded copies of what
 * lives in create-a-tensor.yaml.
 *
 * On 2026-09-13 the exercise grew a `total` step (commit 44cdad9) and the
 * spec's copy did not, so main went red on the e2e job while every content
 * gate stayed green: the corpus test grades the yaml's own solutionCode, and
 * nothing compared it to the spec's copy. This gate is that comparison. It
 * reads the DELIVERED exercise (the velite build, the text the UI and the
 * graders actually run), so a stale build fails here the same way it would
 * fail the learner.
 *
 * Lives here rather than in e2e/ because it has to run under plain
 * `pnpm test`, which is where a content edit gets its first verdict.
 */

const SPEC = join(__dirname, "..", "..", "..", "e2e", "exercise-run.spec.ts");
const EXERCISES_JSON = join(__dirname, "..", ".velite", "exercises.json");
const SLUG = "create-a-tensor";

type Delivered = { slug: string; lessonSlug: string; solutionCode: string };

function nonBlankLines(code: string): string[] {
  return code.split("\n").filter((line) => line.trim() !== "");
}

/** The string literals inside `const SOLUTION = [ ... ].join("\n")`. */
function specSolutionLines(source: string): string[] {
  const block = source.match(/const SOLUTION = \[([\s\S]*?)\]\.join\("\\n"\)/);
  if (!block) {
    throw new Error("SOLUTION array not found in e2e/exercise-run.spec.ts");
  }
  return [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
    JSON.parse(`"${m[1]}"`),
  );
}

describe("e2e exercise-run spec mirrors the delivered exercise", () => {
  const source = readFileSync(SPEC, "utf8");
  const delivered: Delivered[] = JSON.parse(
    readFileSync(EXERCISES_JSON, "utf8"),
  );
  const exercise = delivered.find((e) => e.slug === SLUG);
  if (!exercise) {
    throw new Error(
      `${SLUG} is missing from the velite build; run pnpm run build:content`,
    );
  }

  it("types the exercise's own solutionCode, line for line", () => {
    expect(specSolutionLines(source)).toEqual(
      nonBlankLines(exercise.solutionCode),
    );
  });

  it("opens the lesson that exercise belongs to", () => {
    expect(source).toContain(
      `/worlds/deep-orbit/foundations/${exercise.lessonSlug}"`,
    );
  });
});

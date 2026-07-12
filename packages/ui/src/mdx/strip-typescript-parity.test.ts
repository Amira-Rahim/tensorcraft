import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScript } from "./strip-typescript";
// The CI grader's copy. These two implementations MUST stay line-for-line
// identical; this suite fails on any divergence over the real corpus.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - importing an .mjs module from outside the package for parity only
import { stripTypeScript as graderStrip } from "../../../../scripts/lib/strip-typescript.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const exercisesPath = resolve(here, "../../../content/.velite/exercises.json");

interface ExerciseRecord {
  slug: string;
  starterCode?: string;
  solutionCode?: string;
  testCode?: string;
}

const exercises: ExerciseRecord[] = JSON.parse(
  readFileSync(exercisesPath, "utf8"),
);

function parses(code: string): string | null {
  try {
    // Mirror buildFullCode's wrapper (async IIFE) minus the harness; the
    // harness itself is plain JS and adds no parse risk.
    new Function(`return (async function() {\n${code}\n})`);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

describe("stripTypeScript: runtime and grader copies agree on the full corpus", () => {
  it("loads a non-trivial corpus", () => {
    expect(exercises.length).toBeGreaterThan(50);
  });

  for (const ex of exercises) {
    it(`${ex.slug}: identical strip output + stripped code parses`, () => {
      for (const field of [
        "starterCode",
        "solutionCode",
        "testCode",
      ] as const) {
        const src = ex[field] ?? "";
        const runtime = stripTypeScript(src);
        const grader = graderStrip(src);
        expect(runtime).toBe(grader);
      }
      // The full runtime bundle (user code + tests) must parse as JS for
      // both starter and solution. A SyntaxError here means a learner sees
      // a broken exercise no matter what they type.
      const solutionBundle =
        stripTypeScript(ex.solutionCode ?? "") +
        "\n" +
        stripTypeScript(ex.testCode ?? "");
      expect(parses(solutionBundle)).toBeNull();
      const starterBundle =
        stripTypeScript(ex.starterCode ?? "") +
        "\n" +
        stripTypeScript(ex.testCode ?? "");
      expect(parses(starterBundle)).toBeNull();
    });
  }
});

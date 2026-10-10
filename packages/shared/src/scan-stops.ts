/**
 * Where each step of a challenge brief lives in the learner's code.
 *
 * A step fills one variable (its `target`) whose starter declaration holds
 * a placeholder, `null` by default: `const reading = null;`. This scans code
 * line by line for each target's declaration and reports its state, so the
 * build (packages/content) and the editor (packages/ui) agree on every line
 * number (spec 2026-10-10, sections 4 and 5).
 *
 * Self-contained on purpose. The velite transform imports this file by
 * RELATIVE path, because velite bundles its config with esbuild and leaves
 * bare package imports to Node, which cannot load this package's
 * extensionless re-exports. Keep it free of imports, and use only
 * TypeScript that type erasure can remove.
 */

/** One stop's state (spec 2026-10-10, section 4). */
export type StopState = "waiting" | "other" | "typed" | "missing";

export interface StopSpec {
  /** The variable the step fills, for example `reading`. */
  target: string;
  /** The code the brief shows, for example `tf.tensor(streamValues)`. */
  code: string;
  /** The starter's stand-in value. Defaults to `null`. */
  placeholder?: string;
}

export interface StopScan {
  /** 1-based line of the first declaration of the target, or null. */
  line: number | null;
  state: StopState;
  /** 0-based columns of the right-hand side in that line, end exclusive. */
  rhsStart: number;
  rhsEnd: number;
  /** How many lines declare the target. The build requires exactly one. */
  matches: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whitespace and one trailing semicolon do not change what was typed. */
function squash(code: string): string {
  return code.replace(/\s+/g, "").replace(/;$/, "");
}

export function scanStops(
  lines: readonly string[],
  steps: readonly StopSpec[],
): StopScan[] {
  return steps.map((step) => {
    const declaration = new RegExp(
      `^(\\s*(?:const|let|var)\\s+${escapeRegExp(step.target)}\\s*=\\s*)(.*?)\\s*;?\\s*$`,
    );
    let line: number | null = null;
    let prefix = "";
    let rhs = "";
    let matches = 0;
    for (let index = 0; index < lines.length; index += 1) {
      const match = declaration.exec(lines[index]);
      if (!match) continue;
      matches += 1;
      if (line === null) {
        line = index + 1;
        prefix = match[1];
        rhs = match[2];
      }
    }
    if (line === null) {
      return {
        line: null,
        state: "missing",
        rhsStart: 0,
        rhsEnd: 0,
        matches: 0,
      };
    }
    const written = squash(rhs);
    const state: StopState =
      written === squash(step.placeholder ?? "null")
        ? "waiting"
        : written === squash(step.code)
          ? "typed"
          : "other";
    return {
      line,
      state,
      rhsStart: prefix.length,
      rhsEnd: prefix.length + rhs.length,
      matches,
    };
  });
}

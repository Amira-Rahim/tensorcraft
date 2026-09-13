import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { stripTypeScript as stripShipped } from "./strip-typescript";

/**
 * GATE: the TypeScript stripper must not touch the INSIDE of literals.
 *
 * Found by a blind verifier on 2026-09-12. Every regex in the stripper ran
 * over the whole source, so the `as Type` assertion regex deleted the words
 * "as JSON" from inside a prompt string, and a learner who wrote the most
 * natural English for module 9's output request ("Reply as JSON with the
 * fields ...") failed the grader with no hint why. The same regex turned
 * "the reading as anomalous" into "the reading". Both copies of the
 * stripper now mask string, template, regex and comment contents before
 * the pipeline runs, and this file pins that on BOTH copies: the parity
 * test proves they agree, this one proves what they agree on.
 */
const require = createRequire(import.meta.url);
const { stripTypeScript: stripCi } =
  require("../../../../scripts/lib/strip-typescript.mjs") as {
    stripTypeScript: (code: string) => string;
  };

const CASES: Array<[string, string, string]> = [
  [
    "a single-quoted prompt keeps 'as JSON'",
    "const p = 'Reply as JSON with the fields classification, confidence and reasoning.';",
    "const p = 'Reply as JSON with the fields classification, confidence and reasoning.';",
  ],
  [
    "a double-quoted string keeps 'as anomalous'",
    'const p = "Treat the reading as anomalous";',
    'const p = "Treat the reading as anomalous";',
  ],
  [
    "a template keeps its text and still strips inside ${ }",
    "const q = `Return as JSON: ${signal.amplitude as number}`;",
    "const q = `Return as JSON: ${signal.amplitude}`;",
  ],
  [
    "a real assertion is still stripped and a comment is left alone",
    "const x = foo as JSON; // treat as X",
    "const x = foo; // treat as X",
  ],
  [
    "a regex literal keeps its body; division followed by as is still stripped",
    "const re = /as JSON/; const y = a / b as number;",
    "const re = /as JSON/; const y = a / b;",
  ],
  [
    "a string-literal union type is still stripped (the token goes with it)",
    'const k: "a" | "b" = "a";',
    'const k= "a";',
  ],
];

describe("stripTypeScript leaves literal contents alone", () => {
  for (const [name, input, expected] of CASES) {
    it(`shipped runtime: ${name}`, () => {
      expect(stripShipped(input)).toBe(expected);
    });
    it(`CI grader: ${name}`, () => {
      expect(stripCi(input)).toBe(expected);
    });
  }
});

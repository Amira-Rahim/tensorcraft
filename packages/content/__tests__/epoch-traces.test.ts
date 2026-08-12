import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { describe, it, expect } from "vitest";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_DIR,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";
import { dirname, join } from "node:path";

/**
 * Claimed-epoch trace gate (audit run #7, 2026-07-16).
 *
 * Two lessons printed training traces with epoch numbers their own code can
 * never produce: "Epoch 100" from `fit({epochs: 100})` with an
 * `if (epoch % 20 === 0)` callback (TFJS epochs are 0-indexed, so prints
 * stop at 80), and "Epoch 50" from a `% 10` callback with epochs: 50 (stops
 * at 40). A learner diffing their console against the trace can never match
 * it, in a course whose brand is numbers that reproduce.
 *
 * The gate is mechanical: inside each code block that both fits with a known
 * epoch count and filters its logging with `epoch % M`, every claimed
 * "// Epoch K:" line must satisfy K <= epochs - 1 and K % M === 0.
 */

const CONTENT_ROOT = dirname(CONTENT_DIR);
// Scope tracks the build via one shared constant (F3). Adding a launched
// world to BUILT_WORLD_DIRS extends this gate automatically.
const LAUNCHED_WORLD_DIRS = [...BUILT_WORLD_DIRS];

interface TraceCase {
  id: string;
  epochs: number;
  modulo: number;
  claimed: number[];
}

function collectCases(): TraceCase[] {
  const cases: TraceCase[] = [];
  for (const world of LAUNCHED_WORLD_DIRS) {
    for (const file of lessonFiles(join(CONTENT_ROOT, world)) as string[]) {
      const source = readFileSync(file, "utf8");
      // Split on CodeBlock boundaries so an epochs: in one block never
      // pairs with a trace in another.
      const blocks = source.split(/<CodeBlock/);
      blocks.forEach((block, i) => {
        const epochs = block.match(/epochs:\s*(\d+)/)?.[1];
        const modulo = block.match(/epoch\s*%\s*(\d+)\s*===\s*0/)?.[1];
        const claimed = [...block.matchAll(/\/\/\s*Epoch\s+(\d+)\s*:/g)].map(
          (m) => Number(m[1]),
        );
        if (!epochs || !modulo || claimed.length === 0) return;
        cases.push({
          id: `${relative(CONTENT_ROOT, file)}#block${i}`,
          epochs: Number(epochs),
          modulo: Number(modulo),
          claimed,
        });
      });
    }
  }
  return cases;
}

describe("claimed epoch traces are producible by their own code", () => {
  const cases = collectCases();

  it("finds at least the known trace blocks (sanity)", () => {
    expect(cases.length).toBeGreaterThanOrEqual(2);
  });

  it.each(cases)("$id", ({ id, epochs, modulo, claimed }: TraceCase) => {
    const impossible = claimed.filter(
      (k) => k > epochs - 1 || k % modulo !== 0,
    );
    expect(
      impossible,
      `${id}: the trace claims Epoch ${impossible.join(", ")} but ` +
        `fit({epochs: ${epochs}}) with an "epoch % ${modulo}" callback can ` +
        `only print 0..${epochs - 1} in steps of ${modulo} (TFJS epochs are ` +
        `0-indexed). A learner can never reproduce this line.`,
    ).toEqual([]);
  });
});

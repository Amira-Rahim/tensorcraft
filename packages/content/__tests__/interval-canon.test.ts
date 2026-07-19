import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Pulse-interval canon gate (audit run #7, 2026-07-16).
 *
 * The season's spine is a countdown: the anomalous pulse interval shrinks
 * from 73.4 seconds to 29.7 across eleven modules, and the course's brand
 * is numbers a skeptical reader can check. Run #7 found the ticker had
 * drifted: module 9 skipped its numbers entirely, the Kalman lesson's log
 * read as a drift rate ~100x the ticker, and the finale explained the
 * divergent forecasts with an "acceleration" the printed sequence
 * contradicted. All repaired; this gate pins the repaired canon.
 *
 * Every "NN.N seconds" mention in deep-orbit must match this table exactly,
 * and the sequence must be non-increasing in course order. Changing an
 * interval is a deliberate edit HERE plus the lesson, never a silent drift.
 */

const MODULE_ORDER: Record<string, number> = {
  foundations: 1,
  "neural-networks": 2,
  "training-loop": 3,
  "browser-runtimes": 4,
  "signal-processing": 5,
  "recurrent-networks": 6,
  "anomaly-detection": 7,
  "advanced-time-series": 8,
  "llm-integration": 9,
  "optimization-edge": 10,
  capstone: 11,
};

/** file (relative to deep-orbit) -> the interval mentions it must contain. */
const CANON: Record<string, number[]> = {
  "signal-processing/03-spectrograms.mdx": [73.4, 73.4],
  "advanced-time-series/01-beyond-lstm.mdx": [73.4],
  "advanced-time-series/03-forecasting.mdx": [73.4],
  "advanced-time-series/04-kalman-filters.mdx": [72.4],
  "advanced-time-series/05-ensemble-methods.mdx": [72.4],
  "llm-integration/01-llms-for-science.mdx": [63.1],
  "llm-integration/05-multi-model-systems.mdx": [62.0],
  "llm-integration/exercises/rag-pipeline.yaml": [61.2],
  "optimization-edge/01-model-profiling.mdx": [61.2],
  "optimization-edge/03-pruning.mdx": [55.1],
  "optimization-edge/05-webgpu-acceleration.mdx": [47.9],
  "capstone/01-system-architecture.mdx": [47.0, 47.0, 47.0],
  "capstone/02-ci-cd-pipeline.mdx": [44.0],
  "capstone/03-monitoring.mdx": [37.0],
  "capstone/04-documentation.mdx": [31.6],
  "capstone/05-launch.mdx": [29.7],
};

const INTERVAL = /(\d{2}\.\d) ?seconds?\b/g;

function collect(): Record<string, number[]> {
  const found: Record<string, number[]> = {};
  const walk = (dir: string, rel: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const relPath = rel ? `${rel}/${entry}` : entry;
      if (existsSync(full) && readdirSync(dir).includes(entry)) {
        if (entry.endsWith(".mdx") || entry.endsWith(".yaml")) {
          const matches = [
            ...readFileSync(full, "utf8").matchAll(INTERVAL),
          ].map((m) => Number(m[1]));
          if (matches.length) found[relPath] = matches;
        } else if (!entry.includes(".")) {
          walk(full, relPath);
        }
      }
    }
  };
  walk(CONTENT_DIR, "");
  return found;
}

describe("pulse-interval canon", () => {
  const found = collect();

  it("every interval mention in deep-orbit matches the canon table", () => {
    expect(found).toEqual(CANON);
  });

  it("the countdown is non-increasing in course order", () => {
    const timeline: { order: number; file: string; value: number }[] = [];
    for (const [file, values] of Object.entries(CANON)) {
      const moduleSlug = file.split("/")[0];
      const order = MODULE_ORDER[moduleSlug];
      for (const value of values) timeline.push({ order, file, value });
    }
    timeline.sort((a, b) => a.order - b.order);

    for (let i = 1; i < timeline.length; i++) {
      expect(
        timeline[i].value,
        `${timeline[i].file} reads ${timeline[i].value}s but ` +
          `${timeline[i - 1].file} (earlier or same module) reads ` +
          `${timeline[i - 1].value}s. The interval only ever shrinks.`,
      ).toBeLessThanOrEqual(timeline[i - 1].value);
    }
  });
});

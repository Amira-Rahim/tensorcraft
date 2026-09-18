import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";
import { BUILT_STORY_WORLDS } from "../src/built-worlds";

/**
 * Pulse-interval canon gate (audit run #7, 2026-07-16).
 *
 * The season's spine is a countdown: the anomalous pulse interval shrinks
 * from 73.4 seconds to 29.7 across eleven modules, and the course's brand
 * is numbers a skeptical reader can check. Run #7 found the ticker had
 * drifted; all repaired, and this gate pins the repaired canon.
 *
 * PER-WORLD (scalability audit F3). The canon was a single deep-orbit table;
 * it now lives in WORLD_INTERVAL_CANON keyed by world, and the gate iterates
 * every BUILT story world that declares one. A second world with its own
 * numeric spine is covered by adding its table here - no gate rewrite. Worlds
 * with no numeric-countdown spine simply declare no canon and are skipped.
 *
 * The content root is derived from deep-orbit's dir so each world resolves to
 * its own content directory.
 */

// packages/content/content - parent of every world's content dir.
const CONTENT_ROOT: string = dirname(CONTENT_DIR);

/** Per-world module order + interval canon. Only worlds with a numeric
 *  countdown spine appear here. */
interface WorldCanon {
  moduleOrder: Record<string, number>;
  /** file (relative to the world dir) -> the interval mentions it must contain. */
  canon: Record<string, number[]>;
  /**
   * Mentions that are deliberate CALLBACKS to an earlier era (e.g. the finale
   * quoting the module-8 reading while settling an old question). They must
   * still appear in `canon` (the mention is pinned), but they are excluded
   * from the non-increasing countdown timeline, which tracks only live
   * readings.
   */
  historical?: Record<string, number[]>;
}

const DEEP_ORBIT_MODULE_ORDER: Record<string, number> = {
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

/** deep-orbit: file (relative to the world dir) -> required interval mentions. */
const DEEP_ORBIT_CANON: Record<string, number[]> = {
  "signal-processing/03-spectrograms.mdx": [73.4, 73.4],
  // Run #8: ad/05 stages the interval decomposition on-page and names the
  // steady 73.4 s carrier gap to reconcile it with the Fibonacci
  // SUB-intervals inside each pulse. Module 7, pre-shrink: 73.4 is canon.
  "anomaly-detection/05-the-anomaly.mdx": [73.4],
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
  // Editorial pass 2026-08-19: capstone/01 dropped one 47.0 (the consequence
  // logline no longer repeats verbatim in the epilogue), and the finale now
  // pays off Nazari's interval-hits-zero question with a callback to the
  // 72.4 s era (canon value of advanced-time-series/04-05) before the live
  // 29.7 s reading.
  "capstone/01-system-architecture.mdx": [47.0, 47.0],
  "capstone/02-ci-cd-pipeline.mdx": [44.0],
  "capstone/03-monitoring.mdx": [37.0],
  "capstone/04-documentation.mdx": [31.6],
  "capstone/05-launch.mdx": [72.4, 73.4, 29.7],
};

/**
 * The per-world registry. Only worlds with a numeric countdown spine declare a
 * canon; the rest are simply absent and skipped. Add a world's table here and
 * the gate covers it - no rewrite.
 */
const WORLD_INTERVAL_CANON: Record<string, WorldCanon> = {
  "deep-orbit": {
    moduleOrder: DEEP_ORBIT_MODULE_ORDER,
    canon: DEEP_ORBIT_CANON,
    // The finale's 72.4 is Nazari's interval-hits-zero question being paid
    // off with the module-8 reading; it is a quotation of the past, not a
    // live reading, so the countdown check skips it.
    // 73.4 is the explicit callback to the initial pulse interval.
    historical: { "capstone/05-launch.mdx": [72.4, 73.4] },
  },
};

const INTERVAL = /(\d{2}\.\d) ?seconds?\b/g;

function collect(worldDir: string): Record<string, number[]> {
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
  walk(worldDir, "");
  return found;
}

// One describe block per BUILT story world that declares a canon. Worlds
// without a numeric spine (no registry entry) are skipped, not failed.
for (const world of BUILT_STORY_WORLDS) {
  const spec = WORLD_INTERVAL_CANON[world];
  if (!spec) continue;

  describe(`pulse-interval canon (${world})`, () => {
    const found = collect(join(CONTENT_ROOT, world));

    it("every interval mention matches the canon table", () => {
      expect(found).toEqual(spec.canon);
    });

    it("the countdown is non-increasing in course order", () => {
      const timeline: { order: number; file: string; value: number }[] = [];
      for (const [file, values] of Object.entries(spec.canon)) {
        const moduleSlug = file.split("/")[0];
        const order = spec.moduleOrder[moduleSlug];
        // Drop one timeline entry per declared historical callback; the
        // mention itself is still pinned by the canon-table assertion above.
        const skips = [...(spec.historical?.[file] ?? [])];
        for (const value of values) {
          const skipAt = skips.indexOf(value);
          if (skipAt !== -1) {
            skips.splice(skipAt, 1);
            continue;
          }
          timeline.push({ order, file, value });
        }
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
}

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";

/**
 * GATE: every graded field a starter declares in a type must be visible to
 * the learner (blind verification of the de-recipe batch, 2026-09-12).
 *
 * THE FINDING. tfjs-setup's grader asserted `result.backend` and
 * `result.version` by name. The authored starter declared them in a return
 * type, `Promise<{ backend: string; version: string }>`, and nothing else
 * named them. velite's tsToJs transform strips every interface, type alias
 * and annotation before the UI shows the starter, so the learner opened an
 * exercise whose contract existed nowhere they could reach. A submission
 * written from the instructions alone returned `{ backendName, tfjsVersion }`
 * and scored 1 of 2. The same hole sat in browser-ml-tradeoffs (four input
 * fields and the two verdict strings), load-model, llm-client, profile-model
 * and write-model-card: seven exercises, all fixed by naming the fields in
 * the instructions.
 *
 * THE STRUCTURAL CAUSE. The starter dictation gate scores the AUTHORED yaml,
 * where the interfaces still stand, and its docstring allows "the signature
 * with its parameter names and types". A starter can score 0.000 there while
 * withholding the contract from the only reader who matters. This gate reads
 * the DELIVERED starter (packages/content/.velite/exercises.json, the build
 * the UI and both graders run) and checks the half the dictation gate cannot
 * see: a field declared inside a stripped interface, asserted by name in
 * testCode, has to appear in the instructions or in the delivered starter.
 *
 * WHAT IS PINNED. Two exercises declare interfaces for the DATA the grader
 * hands in, not for what the learner returns: retrieve-signals reads `id`
 * and `anomalyScore` off rows the learner passes through untouched, and
 * prune-weights types the model's own `setWeights`. Those are
 * not contracts the learner has to produce, so they are pinned with that
 * reason. Add to the pin only with a reason a learner would accept.
 */

const CONTENT_ROOT = join(__dirname, "..", "content");
const EXERCISES_JSON = join(__dirname, "..", ".velite", "exercises.json");

const INPUT_ONLY_FIELDS: Record<string, string[]> = {
  "retrieve-signals": ["id", "anomalyScore"],
  "prune-weights": ["setWeights"],
};

type Delivered = {
  slug: string;
  instructions: string;
  starterCode: string;
  testCode: string;
};

function authoredStarters(): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (full.includes("/exercises/") && name.endsWith(".yaml")) {
        const raw = readFileSync(full, "utf8");
        const slug = raw.match(/^slug:\s*(\S+)/m)?.[1];
        const starter = raw
          .split(/^starterCode:\s*\|\s*$/m)[1]
          ?.split(/^\w+:/m)[0];
        if (slug && starter) out.set(slug, starter);
      }
    }
  };
  for (const world of BUILT_WORLD_DIRS) walk(join(CONTENT_ROOT, world));
  return out;
}

function interfaceFields(starter: string): string[] {
  const fields = new Set<string>();
  for (const m of starter.matchAll(/interface\s+\w+\s*\{([^}]*)\}/g)) {
    for (const f of m[1].matchAll(/^\s*(\w+)\??\s*[:(]/gm)) fields.add(f[1]);
  }
  return [...fields];
}

const word = (name: string) => new RegExp(`\\b${name}\\b`);

describe("graded contract visible to the learner", () => {
  const delivered: Delivered[] = JSON.parse(
    readFileSync(EXERCISES_JSON, "utf8"),
  );
  const authored = authoredStarters();

  it("reads a corpus in which starters still declare interfaces", () => {
    const declaring = delivered.filter(
      (e) => interfaceFields(authored.get(e.slug) ?? "").length > 0,
    );
    expect(declaring.length).toBeGreaterThanOrEqual(10);
    expect(
      delivered.filter((e) => /\binterface\b/.test(e.starterCode)).length,
    ).toBeLessThanOrEqual(1);
  });

  it("names every graded interface field in the instructions or the delivered starter", () => {
    const violations: string[] = [];
    for (const e of delivered) {
      const visible = `${e.instructions}\n${e.starterCode}`;
      for (const field of interfaceFields(authored.get(e.slug) ?? "")) {
        if (word(field).test(visible)) continue;
        if (!word(field).test(e.testCode)) continue;
        if (INPUT_ONLY_FIELDS[e.slug]?.includes(field)) continue;
        violations.push(
          `${e.slug}: '${field}' is graded but named only inside a stripped interface`,
        );
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps the pin honest: every pinned field is still declared, graded and invisible", () => {
    const stale: string[] = [];
    for (const [slug, fields] of Object.entries(INPUT_ONLY_FIELDS)) {
      const e = delivered.find((x) => x.slug === slug);
      const declared = interfaceFields(authored.get(slug) ?? "");
      for (const field of fields) {
        const visible = e ? `${e.instructions}\n${e.starterCode}` : "";
        if (
          !e ||
          !declared.includes(field) ||
          !word(field).test(e.testCode) ||
          word(field).test(visible)
        ) {
          stale.push(`${slug}: '${field}' no longer needs the pin`);
        }
      }
    }
    expect(stale, stale.join("\n")).toEqual([]);
  });
});

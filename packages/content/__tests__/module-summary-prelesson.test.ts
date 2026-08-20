import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { describe, it, expect } from "vitest";
import { BUILT_STORY_WORLDS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Pre-lesson module summary gate (2026-08-19 audit, applied 2026-08-20).
 *
 * Owner bar (2026-08-16): every line a reader meets BEFORE lesson 1 must
 * parse with zero product or story vocabulary. Module `description` is the
 * story hook and stays that way, but it renders on two pre-lesson surfaces
 * (the module map and the /pricing curriculum preview), so those now read
 * `summary` instead. This gate keeps `summary` plain: without it the next
 * person to add a module copies the neighbouring description and the story
 * walks straight back onto the funnel.
 *
 * Scope note: this checks the SUMMARY field only. `description` is expected
 * to contain story vocabulary and is deliberately not audited here.
 *
 * Scoped to BUILT_STORY_WORLDS, matching the velite schema: unlaunched
 * worlds' module.yaml files are excluded from the build and render nowhere,
 * so requiring copy for them would be busywork. A world joining that list
 * brings its modules under this gate automatically.
 */

const WORLDS_ROOT = dirname(CONTENT_DIR as string);

/** Canon nouns a first-time reader cannot be assumed to know. */
const STORY_TERMS: { name: string; re: RegExp }[] = [
  { name: "Archimedes", re: /\barchimedes\b/i },
  { name: "DEEP SCAN", re: /\bdeep\s+scan\b/i },
  { name: "ARIA", re: /\bARIA\b/ },
  { name: "Mirza", re: /\bmirza\b/i },
  { name: "Farah", re: /\bfarah\b/i },
  { name: "Nazari", re: /\bnazari\b/i },
  { name: "Demir", re: /\bdemir\b/i },
  { name: "the crew", re: /\bthe crew\b/i },
  { name: "the ship", re: /\bthe ship\b/i },
  { name: "bridge console", re: /\bbridge console\b/i },
  { name: "Protocol Sentinel", re: /\bprotocol sentinel\b/i },
  { name: "mission", re: /\bmission\b/i },
];

function moduleYamlPaths(): string[] {
  const out: string[] = [];
  for (const world of BUILT_STORY_WORLDS) {
    const worldDir = join(WORLDS_ROOT, world);
    if (!statSync(worldDir).isDirectory()) continue;
    for (const mod of readdirSync(worldDir)) {
      const p = join(worldDir, mod, "module.yaml");
      try {
        if (statSync(p).isFile()) out.push(p);
      } catch {
        // not a module directory
      }
    }
  }
  return out;
}

/** Reads the scalar `summary:` line. The field is authored as a quoted
 *  one-liner on purpose, so a block scalar is treated as absent and fails. */
function readSummary(file: string): string | null {
  const m = /^summary:\s*"([^"]+)"\s*$/m.exec(readFileSync(file, "utf8"));
  return m ? m[1] : null;
}

describe("module summaries are pre-lesson safe", () => {
  const files = moduleYamlPaths();

  it("finds the module corpus", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("every module defines a quoted one-line summary", () => {
    const missing = files
      .filter((f) => readSummary(f) === null)
      .map((f) => basename(dirname(f)));
    expect(missing).toEqual([]);
  });

  it("no summary uses story vocabulary", () => {
    const hits: string[] = [];
    for (const f of files) {
      const summary = readSummary(f);
      if (!summary) continue;
      for (const term of STORY_TERMS) {
        if (term.re.test(summary)) {
          hits.push(`${basename(dirname(f))}: "${term.name}"`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("summaries stay short enough to read in one pass", () => {
    const tooLong = files
      .map((f) => [basename(dirname(f)), readSummary(f)] as const)
      .filter(([, s]) => s !== null && s.length > 220)
      .map(([slug, s]) => `${slug}: ${s?.length} chars`);
    expect(tooLong).toEqual([]);
  });
});

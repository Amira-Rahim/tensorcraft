import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * AI-slop lexicon gate (owner directive, 2026-08-12).
 *
 * Mechanical enforcement of the high-precision tier of
 * docs/writing-quality-rubric.md: vocabulary and framing patterns that are
 * wrong in essentially every prose context this repo has. The judgment tier
 * (inflated contrast, overloaded sentences, manufactured rhythm) cannot be
 * regexed without false positives and stays editorial; see the rubric.
 *
 * Scope: ALL worlds' lesson MDX (launched or not; future content lands in
 * unlaunched dirs first), module.yaml files, and the prose fields of
 * exercise yamls. Code is exempt: fenced blocks, CodeBlock template bodies,
 * and inline backtick spans are stripped before scanning, which is also what
 * keeps the two blessed em-dash survivors (both inside code) out of scope.
 *
 * Calibrated to zero hits on the 2026-08-12 corpus after the two-round slop
 * audit (docs/audits/ai-slop-audit-2026-08-12.md). Per the metadata gate's
 * hard-won rule: a gate that fires on correct prose gets muted within a
 * week; any new pattern added here MUST be re-calibrated against the full
 * corpus first. Genuinely justified uses (a lesson quoting or teaching the
 * word itself) go in ALLOWLIST with a reason.
 */

const CONTENT_ROOT = dirname(CONTENT_DIR);

/** file (relative to content root) -> patterns allowed there, with reasons */
const ALLOWLIST: Record<string, RegExp[]> = {};

type Pattern = { name: string; re: RegExp };

const PATTERNS: Pattern[] = [
  { name: "em dash in prose (style bible rule 6)", re: /—/ },
  { name: "delve", re: /\bdelv(e|es|ed|ing)\b/i },
  { name: "tapestry", re: /\btapestr(y|ies)\b/i },
  { name: "testament to", re: /\btestament to\b/i },
  { name: "ever-evolving", re: /\bever-evolving\b/i },
  { name: "fast-paced", re: /\bfast-paced\b/i },
  { name: "in today's (scene-setting)", re: /\bin today['’]s\b/i },
  { name: "in conclusion", re: /\bin conclusion\b/i },
  { name: "important to note", re: /\bimportant to note\b/i },
  { name: "when it comes to", re: /\bwhen it comes to\b/i },
  { name: "game-changer", re: /\bgame[- ]chang/i },
  { name: "revolutionize", re: /\brevolutioni[sz]/i },
  { name: "paradigm", re: /\bparadigm/i },
  { name: "synergy", re: /\bsynerg/i },
  { name: "holistic", re: /\bholistic\b/i },
  { name: "unleash", re: /\bunleash/i },
  { name: "embark", re: /\bembark/i },
  { name: "beacon", re: /\bbeacon\b/i },
  { name: "nestled", re: /\bnestled\b/i },
  { name: "buckle up", re: /\bbuckle up\b/i },
  { name: "look no further", re: /\blook no further\b/i },
  {
    name: "let's dive / deep dive",
    re: /\b(let['’]s dive|deep dive|dive deep)\b/i,
  },
  { name: "cutting-edge", re: /\bcutting-edge\b/i },
  { name: "groundbreaking", re: /\bgroundbreaking\b/i },
  { name: "renowned", re: /\brenowned\b/i },
  { name: "vibrant", re: /\bvibrant\b/i },
  { name: "seamless", re: /\bseamless/i },
  { name: "supercharge", re: /\bsupercharg/i },
  { name: "harness the", re: /\bharness the\b/i },
  { name: "empower", re: /\bempower/i },
  { name: "elevate your", re: /\belevate your\b/i },
  { name: "unlock your", re: /\bunlock your\b/i },
  {
    name: "vague authority (name the source instead)",
    re: /\b(experts|researchers|scholars|observers) (say|note|agree|acknowledge)\b|\bresearch (consistently )?shows\b|\bstudies (show|suggest)\b/i,
  },
];

/** Strip everything the rubric exempts as code before scanning. */
function proseOf(mdxSource: string): string {
  return (
    mdxSource
      // fenced code blocks (``` ... ```), including CodeBlock MDX bodies
      .replace(/```[\s\S]*?```/g, "")
      // CodeBlock/template-literal bodies: {` ... `}
      .replace(/\{`[\s\S]*?`\}/g, "")
      // inline code spans
      .replace(/`[^`\n]*`/g, "")
  );
}

/** Exercise yamls: only title + single-line instructions are prose. */
function exerciseProse(yamlSource: string): string {
  const lines: string[] = [];
  for (const field of ["title", "instructions"]) {
    const m = yamlSource.match(new RegExp(`^${field}:[ \\t]*(.*)$`, "m"));
    if (m) lines.push(m[1]);
  }
  return lines.join("\n");
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

type Target = { rel: string; prose: string };

function targets(): Target[] {
  const out: Target[] = [];
  for (const full of walk(CONTENT_ROOT)) {
    const rel = relative(CONTENT_ROOT, full);
    const source = () => readFileSync(full, "utf-8");
    if (full.endsWith(".mdx")) {
      out.push({ rel, prose: proseOf(source()) });
    } else if (full.endsWith("module.yaml")) {
      out.push({ rel, prose: source() });
    } else if (full.endsWith(".yaml") && rel.includes("exercises")) {
      out.push({ rel, prose: exerciseProse(source()) });
    }
  }
  return out;
}

describe("slop lexicon (docs/writing-quality-rubric.md, high-precision tier)", () => {
  const files = targets();

  it("scans the whole corpus", () => {
    // 305 mdx + module.yamls + exercise yamls; a collapse here means the
    // walker broke, not that the corpus shrank.
    expect(files.length).toBeGreaterThan(600);
  });

  it("finds zero banned patterns in learner-visible prose", () => {
    const hits: string[] = [];
    for (const { rel, prose } of files) {
      const allowed = ALLOWLIST[rel] ?? [];
      const lines = prose.split("\n");
      for (const { name, re } of PATTERNS) {
        if (allowed.some((a) => a.source === re.source)) continue;
        lines.forEach((line, i) => {
          if (re.test(line)) {
            hits.push(`${rel}:${i + 1} [${name}] ${line.trim().slice(0, 120)}`);
          }
        });
      }
    }
    expect(
      hits,
      `Banned AI-slop pattern(s) found. Fix the prose (see docs/writing-quality-rubric.md); ` +
        `only allowlist a hit when the lesson is genuinely about the word.\n${hits.join("\n")}`,
    ).toEqual([]);
  });
});

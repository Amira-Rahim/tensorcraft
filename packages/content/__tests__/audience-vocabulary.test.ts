import { execFileSync } from "node:child_process";
import { describe, it, expect } from "vitest";

/**
 * Audience-vocabulary gate (2026-08 rebrand, docs/writing-quality-rubric.md
 * "House vocabulary").
 *
 * Published brand copy uses JavaScript engineers. This gate keeps the retired
 * "frontend <audience noun>" phrasing from re-entering through future copy,
 * docs, or the news-bot prompts, the same way the em-dash gate next door
 * pins its sweep. Architectural uses of "frontend" ("Next.js frontend",
 * frontend/backend split) do not match because the ban targets the noun
 * pairing, not the word.
 *
 * The 2026-10-16 owner directive names frontend developers as the learning
 * audience. Binding project guidance may state that audience explicitly while
 * published brand vocabulary stays unchanged.
 * ALLOWLIST: files that legitimately carry the phrasing. Historical
 * records (docs/audits, docs/superpowers, docs/scripts) are excluded
 * wholesale; the named files below each state the old wording on purpose
 * (rule text, gate history, a podcast's own descriptor, a migration
 * comment, and the backfill script's search string). Add a file here only
 * with a reason of that kind.
 */

// Built from pieces so this file cannot match its own pattern.
const PATTERN = ["front", "-?", "end", " (engineer|developer|dev)s?"].join("");

const ALLOWED_FILES = new Set([
  "AGENTS.md", // Binding learning-audience directive, 2026-10-16.
  "CLAUDE.md", // Binding learning-audience directive, 2026-10-16.
  "packages/content/__tests__/audience-vocabulary.test.ts", // Documents that directive.
  "docs/dev-plan.md",
  "docs/marketing-plan.md",
  "docs/roadmap.md",
  "docs/writing-quality-rubric.md",
  "packages/supabase/migrations/059_rename_fe_identifiers_to_js.sql",
  "scripts/one-off/backfill-learner-readmes.mjs",
]);

function gitGrep(args: string[]): string {
  try {
    return execFileSync("git", args, { encoding: "utf-8" });
  } catch (error) {
    // git grep exits 1 when nothing matches, which is the passing case.
    const e = error as { status?: number; stdout?: string };
    if (e.status === 1) return "";
    throw error;
  }
}

describe("audience vocabulary (JavaScript engineers, repo-wide)", () => {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
  }).trim();

  it("finds no retired frontend-audience phrasing outside the allowlist", () => {
    const out = gitGrep([
      "-C",
      root,
      "grep",
      "-I",
      "-n",
      "-i",
      "-E",
      PATTERN,
      "--",
      ".",
      ":(exclude)docs/audits",
      ":(exclude)docs/superpowers",
      ":(exclude)docs/scripts",
      ":(exclude)pnpm-lock.yaml",
    ]);
    const hits = out
      .split("\n")
      .filter(Boolean)
      .filter((line) => !ALLOWED_FILES.has(line.split(":")[0]));
    expect(
      hits,
      `Retired published brand phrasing found. The brand register is JavaScript ` +
        `engineers (docs/writing-quality-rubric.md, House vocabulary). ` +
        `Rewrite per the vocabulary table, or extend ALLOWED_FILES in this ` +
        `gate with a stated reason if the mention is a deliberate ` +
        `historical or functional reference.\n` +
        hits.slice(0, 20).join("\n"),
    ).toEqual([]);
  });
});

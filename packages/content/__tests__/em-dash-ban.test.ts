import { execFileSync } from "node:child_process";
import { describe, it, expect } from "vitest";

/**
 * Repo-wide em dash ban (CLAUDE.md, owner directive 2026-08-15).
 *
 * Broader than the slop-lexicon gate next door: that one guards learner
 * prose; this one guards EVERY tracked text file, including internal docs,
 * code comments, SQL migrations, scripts, and config. The character is
 * banned in literal form everywhere. Code that must detect or strip it
 * (the slop-lexicon regex, quiz.tsx's suffix stripper, the text-cleaning
 * lesson) references it via an escape sequence instead, which this gate
 * deliberately cannot see. The gate itself builds the character from its
 * codepoint for the same reason.
 *
 * Lives here (not in a per-app suite) because the ban is repo-wide and this
 * package's __tests__ dir already hosts the cross-cutting prose gates that
 * CI's plain `pnpm test` picks up.
 */

const EM_DASH = String.fromCharCode(0x2014);

function gitGrep(args: string[]): string {
  try {
    return execFileSync("git", args, { encoding: "utf-8" });
  } catch (error) {
    // git grep exits 1 when nothing matches, which is exactly what we want.
    const e = error as { status?: number; stdout?: string };
    if (e.status === 1) return "";
    throw error;
  }
}

describe("em dash ban (CLAUDE.md, repo-wide)", () => {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf-8",
  }).trim();

  it("finds zero literal em dashes in tracked text files", () => {
    const out = gitGrep([
      "-C",
      root,
      "grep",
      "-I", // text files only; binary art can contain the bytes by chance
      "-n",
      "--fixed-strings",
      EM_DASH,
    ]);
    const hits = out.split("\n").filter(Boolean);
    expect(
      hits,
      `Literal em dash (U+2014) found. The character is banned repo-wide ` +
        `(CLAUDE.md, owner directive 2026-08-15). Rewrite with a comma, ` +
        `colon, period, parentheses, or hyphen; code that must reference ` +
        `the character uses an escape sequence, never the glyph.\n` +
        hits.slice(0, 40).join("\n") +
        (hits.length > 40 ? `\n...and ${hits.length - 40} more` : ""),
    ).toEqual([]);
  });
});

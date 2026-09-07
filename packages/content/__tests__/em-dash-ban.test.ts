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
      // NOTE: -I is why the companion test below exists. A tracked text file
      // that git has decided is binary (one stray NUL byte is enough) is
      // skipped here silently, so the ban can report clean over 137 literal
      // em dashes. Found 2026-09-07 in a July audit document.
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

  /*
   * The gate above greps with -I, which skips any file git classifies as
   * binary. A single NUL byte in an otherwise ordinary text file is enough
   * to earn that classification, and the em dashes inside it then become
   * invisible to a ban CI reports as clean. So: no tracked file with a text
   * extension may be binary to git. If this fails, strip the stray byte
   * rather than relaxing the rule, then expect the ban itself to start
   * reporting whatever the file was hiding.
   */
  it("has no tracked text file that git treats as binary", () => {
    const TEXT_EXT =
      /\.(md|mdx|ts|tsx|js|jsx|mjs|cjs|json|ya?ml|css|sql|txt|html|sh)$/i;
    const tracked = execFileSync("git", ["-C", root, "ls-files", "-z"], {
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
    })
      .split("\0")
      .filter((f) => f && TEXT_EXT.test(f));

    // `git diff --numstat` against the empty tree prints "-\t-\t<path>" for
    // every file it considers binary, which is the same judgement -I makes.
    const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
    const numstat = execFileSync(
      "git",
      ["-C", root, "diff", "--numstat", "-z", EMPTY_TREE],
      { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 },
    );
    const binary = new Set<string>();
    // -z output for a binary file is "-\t-\t" then the NUL-terminated path.
    for (const chunk of numstat.split("\0")) {
      if (chunk.startsWith("-\t-\t")) binary.add(chunk.slice(4));
    }
    const offenders = tracked.filter((f) => binary.has(f));

    expect(
      offenders,
      `Tracked text file(s) that git treats as binary. The em dash gate ` +
        `greps with -I and skips these, so any banned character inside is ` +
        `invisible. Strip the stray NUL byte (perl -i -pe 's/\\0//g' <file>) ` +
        `and re-run.\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });
});

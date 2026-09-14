import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";

/**
 * A lesson must not print its own exercise's answer (round 7, 2026-09-13).
 *
 * Six graders were "beaten" this round by pasting a code block from the
 * parent lesson into the challenge: the block was the solution under
 * another name (browser-runtimes/04 classify, signal-processing/02
 * findDominantFrequency, /03 stft, /05 hannWindow, llm-integration/02 the
 * prompt template, capstone/01 the Pipeline class). Each was closed by
 * changing what the lesson shows, never by weakening the grader.
 *
 * The check is mechanical and deliberately coarse: strip all whitespace from
 * the authored solutionCode and from every CodeBlock in every lesson of the
 * exercise's module (round 7b, 2026-09-14: the parent-only scan missed
 * signal-processing/05 printing build-spectrogram's answer, which belongs to
 * /03), drop the runs that also appear in the starterCode (a lesson may
 * repeat what the learner is handed), and fail on any verbatim run of LIMIT
 * characters or more. Lines the spec dictates (a layer stack, an interface)
 * stay under the limit; a function body does not. A LATER lesson that shows
 * the finished shape a learner has already built is listed in EXEMPT with
 * its reason; an earlier or sibling lesson never is.
 */
const LIMIT = 120;
const STEP = 10;

/** exercise slug -> lessons (by slug) allowed to carry its finished shape. */
const EXEMPT: Record<string, Record<string, string>> = {
  "build-spectrogram": {
    "windowing-and-overlap":
      "lesson 5 builds windowing onto the STFT the learner wrote in lesson 3's challenge; the finished stft is the starting point, not the answer to a challenge on this page",
  },
};

const norm = (t: string) => t.replace(/\s+/g, "");

function yamlBlock(text: string, key: string): string {
  const block = text.match(
    new RegExp(`^${key}: \\|\\n((?:  .*\\n|\\n)+)`, "m"),
  );
  if (block)
    return block[1]
      .split("\n")
      .map((l) => l.slice(2))
      .join("\n");
  const quoted = text.match(
    new RegExp(`^${key}: "((?:[^"\\\\]|\\\\.)*)"`, "m"),
  );
  return quoted ? JSON.parse(`"${quoted[1]}"`) : "";
}

function lessonCode(mdx: string): string {
  const blocks = [...mdx.matchAll(/<CodeBlock[^>]*>\s*\{`([\s\S]*?)`\}/g)].map(
    (m) => m[1]!.replace(/\\`/g, "`").replace(/\\\$/g, "$"),
  );
  return norm(blocks.join("\n"));
}

function longestLeak(solution: string, starter: string, code: string): number {
  let best = 0;
  for (let i = 0; i + LIMIT <= solution.length; i += STEP) {
    let len = LIMIT;
    while (i + len <= solution.length) {
      const run = solution.slice(i, i + len);
      if (!code.includes(run) || starter.includes(run)) break;
      best = Math.max(best, len);
      len += STEP;
    }
  }
  return best;
}

const CONTENT_ROOT = join(__dirname, "..", "content");

describe("no lesson in a module prints one of its exercises' answers", () => {
  const cases: Array<{ slug: string; lesson: string; leak: number }> = [];
  for (const world of BUILT_WORLD_DIRS) {
    const worldDir = join(CONTENT_ROOT, world);
    for (const mod of readdirSync(worldDir, { withFileTypes: true })) {
      if (!mod.isDirectory()) continue;
      const modDir = join(worldDir, mod.name);
      const lessons = readdirSync(modDir)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => readFileSync(join(modDir, f), "utf8"));
      let exercises: string[] = [];
      try {
        exercises = readdirSync(join(modDir, "exercises")).filter((f) =>
          f.endsWith(".yaml"),
        );
      } catch {
        continue;
      }
      for (const file of exercises) {
        const yaml = readFileSync(join(modDir, "exercises", file), "utf8");
        const slug = yaml.match(/^slug: (.*)$/m)?.[1] ?? file;
        const lessonSlug = yaml.match(/^lessonSlug: (.*)$/m)?.[1];
        if (!lessonSlug) continue;
        const solution = norm(yamlBlock(yaml, "solutionCode"));
        const starter = norm(yamlBlock(yaml, "starterCode"));
        for (const lesson of lessons) {
          const thisSlug = lesson.match(/^slug: (.*?)\s*$/m)?.[1];
          if (!thisSlug) continue;
          if (EXEMPT[slug]?.[thisSlug]) continue;
          cases.push({
            slug,
            lesson: thisSlug,
            leak: longestLeak(solution, starter, lessonCode(lesson)),
          });
        }
      }
    }
  }

  it("scans every launched exercise against every lesson of its module", () => {
    // 65 exercises x 5 lessons, less the exemptions.
    expect(cases.length).toBeGreaterThan(300);
  });

  for (const c of cases) {
    it(`${c.slug}: the lesson ${c.lesson} does not carry its solution verbatim`, () => {
      expect(
        c.leak,
        `${c.leak} whitespace-stripped characters of ${c.slug}'s solution appear verbatim in a code block of its lesson (limit ${LIMIT}). Show a different variant, the contract, or the built-in, and let the challenge build the answer.`,
      ).toBeLessThan(LIMIT);
    });
  }
});

import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * mlContent taxonomy gate (fresh-eyes rerun 2026-07-25, ledger §6).
 *
 * The audit blog post (blog/audit-exercise-mlcontent.mdx) promises "Zero
 * mismatches remain" and "The scandal would be labeling that [arithmetic]
 * 'advanced.' We do not." No gate pinned that rule, and by 2026-07-25 four
 * `advanced`+`arithmetic` entries had drifted back in. This test makes the
 * published claim mechanical: a live exercise whose solution is plain JS
 * math (mlContent: arithmetic, which is also the schema default when the
 * tag is omitted) must not carry an `advanced` difficulty badge.
 */

const CONTENT_ROOT = dirname(CONTENT_DIR);
const SHIPPED_DIRS = [...BUILT_WORLD_DIRS];

function exerciseYamls(worldDir: string): string[] {
  const root = join(CONTENT_ROOT, worldDir);
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const mod of readdirSync(root)) {
    const exDir = join(root, mod, "exercises");
    if (!existsSync(exDir)) continue;
    for (const f of readdirSync(exDir)) {
      if (f.endsWith(".yaml")) files.push(join(exDir, f));
    }
  }
  return files;
}

const files = SHIPPED_DIRS.flatMap(exerciseYamls);

function scalarField(raw: string, name: string): string | undefined {
  // Frontmatter scalars are single top-level `key: value` lines; anchoring at
  // column 0 keeps block-scalar code bodies and comments out of the match.
  return raw.match(new RegExp(`^${name}:\\s*"?([\\w-]+)"?\\s*$`, "m"))?.[1];
}

describe("mlContent taxonomy: no advanced badge on arithmetic content", () => {
  it("found the live exercise corpus (sanity)", () => {
    expect(files.length).toBeGreaterThan(60);
  });

  it("no live exercise is difficulty: advanced with mlContent: arithmetic", () => {
    const violations = files.filter((file) => {
      const raw = readFileSync(file, "utf8");
      const difficulty = scalarField(raw, "difficulty");
      // Schema default in velite.config.ts: omitted mlContent = arithmetic.
      const mlContent = scalarField(raw, "mlContent") ?? "arithmetic";
      return difficulty === "advanced" && mlContent === "arithmetic";
    });

    expect(
      violations.map((f) => relative(CONTENT_ROOT, f)),
      `blog/audit-exercise-mlcontent.mdx publishes "Zero mismatches remain": ` +
        `an advanced badge must not sit on arithmetic (plain-JS-math) ` +
        `content. Either lower the difficulty or rebuild the exercise on ` +
        `real TFJS primitives and retag its mlContent.`,
    ).toEqual([]);
  });
});

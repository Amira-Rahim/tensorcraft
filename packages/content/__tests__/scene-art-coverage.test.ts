import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Scene-art coverage gate (2026-08-09).
 *
 * /pricing prints "Illustrated lessons" as purchase evidence. That claim
 * is only safe if it is true by construction, so this asserts plate coverage
 * rather than pinning a count: a pinned `63` would be the exact drift the
 * claim is meant to avoid (see the `21 bonus lessons` literal removed in the
 * same change).
 */
// CONTENT_DIR resolves to packages/content/content/deep-orbit, so it IS the
// lessons root; repo root is three levels above its parent.
const LESSONS_ROOT = CONTENT_DIR;
const REPO_ROOT = join(dirname(CONTENT_DIR), "..", "..", "..");
const PLATES_ROOT = join(REPO_ROOT, "apps/web/public/scenes/deep-orbit");

function builtLessons(): { module: string; slug: string }[] {
  const out: { module: string; slug: string }[] = [];
  for (const mod of readdirSync(LESSONS_ROOT)) {
    const modDir = join(LESSONS_ROOT, mod);
    if (!existsSync(modDir)) continue;
    for (const file of readdirSync(modDir)) {
      if (!file.endsWith(".mdx")) continue;
      // Runtime URLs use frontmatter slugs, which can differ from filenames.
      const source = readFileSync(join(modDir, file), "utf8");
      const frontmatter = source.match(
        /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
      )?.[1];
      const slug = frontmatter?.match(
        /^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m,
      )?.[1];
      if (!slug) throw new Error(`${mod}/${file}: missing frontmatter slug`);
      out.push({ module: mod, slug });
    }
  }
  return out;
}

describe("deep-orbit scene art covers every built lesson", () => {
  const lessons = builtLessons();

  it("found the lessons", () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it.each(lessons)("$module/$slug has a scene plate", ({ module, slug }) => {
    const plate = join(PLATES_ROOT, module, `${slug}.webp`);
    expect(
      existsSync(plate),
      `No plate at scenes/deep-orbit/${module}/${slug}.webp. ` +
        `/pricing claims "Illustrated lessons" - either generate the ` +
        `plate (scripts/art/scenes.mjs) or remove the claim.`,
    ).toBe(true);
  });
});

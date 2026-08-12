import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { BUILT_WORLD_DIRS } from "../src/built-worlds";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_DIR,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";

/**
 * Companion-link resolution gate (2026-07-27).
 *
 * DerivationDrawer builds its "Read full derivation" href by string
 * concatenation at render time: companionSlug becomes
 * /extras/math-deep-dive/<slug>, and companionHref is emitted verbatim.
 * Nothing validated either one, so a typo (or a paste of the wrong slug)
 * shipped a silently wrong link. That is not hypothetical: the
 * fourier-transform DFT drawer pointed at information-theory for weeks
 * because nothing checked the slug made sense, and a misspelled slug would
 * 404 without failing any build.
 *
 * This gate extracts every companionSlug/companionHref from built lessons
 * and asserts each resolves to a real extras lesson (slug taken from MDX
 * frontmatter, the same field the /extras/[module]/[lesson] route resolves).
 */

const CONTENT_ROOT: string = dirname(CONTENT_DIR);

/** slug set per extras module, read from each lesson's frontmatter. */
function extrasSlugsByModule(): Map<string, Set<string>> {
  const extrasDir = join(CONTENT_ROOT, "extras");
  const map = new Map<string, Set<string>>();
  for (const mod of readdirSync(extrasDir)) {
    const modDir = join(extrasDir, mod);
    if (!existsSync(join(modDir, "module.yaml"))) continue;
    const slugs = new Set<string>();
    for (const f of readdirSync(modDir)) {
      if (!f.endsWith(".mdx")) continue;
      const slug = readFileSync(join(modDir, f), "utf8").match(
        /^slug:\s*(\S+)/m,
      )?.[1];
      if (slug) slugs.add(slug);
    }
    map.set(mod, slugs);
  }
  return map;
}

const extras = extrasSlugsByModule();

interface Link {
  file: string;
  kind: "companionSlug" | "companionHref";
  value: string;
}

const links: Link[] = [];
for (const world of BUILT_WORLD_DIRS) {
  for (const file of lessonFiles(join(CONTENT_ROOT, world))) {
    const src = readFileSync(file, "utf8");
    const rel = relative(CONTENT_ROOT, file);
    for (const m of src.matchAll(/companionSlug="([^"]+)"/g)) {
      links.push({ file: rel, kind: "companionSlug", value: m[1] });
    }
    for (const m of src.matchAll(/companionHref="([^"]+)"/g)) {
      links.push({ file: rel, kind: "companionHref", value: m[1] });
    }
  }
}

describe("DerivationDrawer companion links resolve", () => {
  it("discovers exactly the pinned number of companion links (count pin)", () => {
    // 13 companion links as of the 2026-07-27 clarity wave, at which point
    // every math-deep-dive lesson has at least one entry-point drawer and
    // classical-ml is reachable via companionHref. A drop means a drawer
    // lost its link (or this extraction regex rotted); a rise means a new
    // link should be pinned here after verifying it resolves.
    expect(links.length).toBe(13);
  });

  it.each(links.filter((l) => l.kind === "companionSlug"))(
    "$file companionSlug=$value resolves in math-deep-dive",
    ({ file, value }) => {
      const mathDeepDive = extras.get("math-deep-dive") ?? new Set();
      expect(
        mathDeepDive.has(value),
        `${file}: companionSlug "${value}" is not a lesson slug in extras/math-deep-dive; ` +
          `known slugs: ${[...mathDeepDive].join(", ")}`,
      ).toBe(true);
    },
  );

  it.each(links.filter((l) => l.kind === "companionHref"))(
    "$file companionHref=$value points at a real extras lesson",
    ({ file, value }) => {
      const m = value.match(/^\/extras\/([\w-]+)\/([\w-]+)$/);
      expect(
        m,
        `${file}: companionHref "${value}" must match /extras/<module>/<slug>`,
      ).toBeTruthy();
      const [, mod, slug] = m!;
      const slugs = extras.get(mod);
      expect(
        slugs,
        `${file}: extras module "${mod}" does not exist`,
      ).toBeTruthy();
      expect(
        slugs!.has(slug),
        `${file}: "${slug}" is not a lesson slug in extras/${mod}; known: ${[...(slugs ?? [])].join(", ")}`,
      ).toBe(true);
    },
  );
});

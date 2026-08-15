import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Blog link-target gate (2026-07-19, Run #8).
 *
 * The only shipped blog post 404'd its own lesson CTA for two months
 * because it linked /learn/<world>/<module>/<lesson> while lessons live
 * at /worlds/... and nothing checked. Every internal link in every post
 * must resolve to a route that exists.
 *
 * 2026-08-14: all drafted posts were removed; blog posts are written by
 * hand from here on. The gate stays armed because hand-written links rot
 * the same way, and it must pass while the directory is empty.
 */

const BLOG_DIR = join(__dirname, "..", "content", "blog");
const CONTENT_ROOT = join(__dirname, "..", "content");

// Static app routes a post may legitimately link to.
const STATIC_ROUTES = new Set([
  "/",
  "/pricing",
  "/compare",
  "/learn",
  "/blog",
  "/about",
  "/worlds",
  "/auth",
  "/terms",
  "/privacy",
]);

function lessonExists(world: string, moduleId: string, lesson: string) {
  const moduleDir = join(CONTENT_ROOT, world, moduleId);
  if (!existsSync(moduleDir)) return false;
  return readdirSync(moduleDir).some(
    (f) =>
      f.endsWith(".mdx") &&
      f.replace(/^\d+-/, "").replace(/\.mdx$/, "") === lesson,
  );
}

const posts = existsSync(BLOG_DIR)
  ? readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))
  : [];

// Blog-to-blog links resolve against frontmatter slugs, not filenames
// (they can differ in case, e.g. 2026-W18-… vs slug 2026-w18-…).
const postSlugs = new Set(
  posts
    .map(
      (f) =>
        readFileSync(join(BLOG_DIR, f), "utf8").match(/^slug:\s*(\S+)/m)?.[1] ??
        "",
    )
    .filter(Boolean),
);

describe("blog internal links resolve", () => {
  // Anchor test: keeps the suite non-empty while the blog directory has no
  // posts (it.each over [] registers nothing, and vitest rejects a file
  // with zero tests).
  it("blog directory is present for future posts", () => {
    expect(existsSync(BLOG_DIR)).toBe(true);
  });

  it.each(posts)("%s: every internal href resolves", (file) => {
    const raw = readFileSync(join(BLOG_DIR, file), "utf8");
    const hrefs = [...raw.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
    const bad: string[] = [];
    for (const href of hrefs) {
      const path = href.split(/[?#]/)[0];
      if (STATIC_ROUTES.has(path)) continue;
      const lessonMatch = path.match(/^\/worlds\/([^/]+)\/([^/]+)\/([^/]+)$/);
      if (
        lessonMatch &&
        lessonExists(lessonMatch[1], lessonMatch[2], lessonMatch[3])
      ) {
        continue;
      }
      if (path.match(/^\/worlds\/[^/]+$/)) continue; // world landing pages
      const blogMatch = path.match(/^\/blog\/([^/]+)$/);
      if (blogMatch && postSlugs.has(blogMatch[1])) continue;
      bad.push(href);
    }
    expect(bad, `unresolvable links in ${file}: ${bad.join(", ")}`).toEqual([]);
  });

  it.each(posts)(
    "%s: matchedLessons frontmatter entries exist in the corpus",
    (file) => {
      const raw = readFileSync(join(BLOG_DIR, file), "utf8");
      const fm = raw.split("---")[1] ?? "";
      const entries = [
        ...fm.matchAll(
          /worldId:\s*(\S+)[\s\S]*?moduleId:\s*(\S+)[\s\S]*?slug:\s*(\S+)/g,
        ),
      ];
      for (const [, world, moduleId, slug] of entries) {
        expect(
          lessonExists(world, moduleId, slug),
          `${file} matchedLessons points at missing lesson ${world}/${moduleId}/${slug}`,
        ).toBe(true);
      }
    },
  );

  it("no post links the dead /learn/<nested> route shape", () => {
    for (const file of posts) {
      const raw = readFileSync(join(BLOG_DIR, file), "utf8");
      expect(raw.includes("](/learn/"), `${file} uses /learn/<nested>`).toBe(
        false,
      );
    }
  });
});

// Slug handling for the "mark published" curator action, split from
// actions.ts because a "use server" module may only export async actions.

const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PublishSlugResult =
  | { ok: true; slug: string }
  | { ok: false; reason: string };

/**
 * Normalize what a curator pastes (bare slug, /blog/<slug> path, or full
 * post URL, with or without query/hash) and verify it names a post that
 * exists in the current content build. The newsletter and social copy
 * link whatever lands in published_blog_slug, so a typo here becomes a
 * broken link in an email.
 */
export function resolvePublishSlug(
  input: string,
  knownSlugs: ReadonlySet<string>,
): PublishSlugResult {
  const path = input.trim().split(/[?#]/)[0];
  // Strip everything through a "blog/" path segment, but only at a path
  // boundary so a slug that merely contains the letters (my-blog-notes)
  // is left intact and judged on its own shape.
  const marker = path.lastIndexOf("blog/");
  const atBoundary = marker === 0 || (marker > 0 && path[marker - 1] === "/");
  const afterBlog =
    marker >= 0 && atBoundary ? path.slice(marker + "blog/".length) : path;
  const slug = afterBlog.replace(/^\/+|\/+$/g, "");

  if (!slug) {
    return { ok: false, reason: "Enter the slug of the published post." };
  }
  if (!SLUG_SHAPE.test(slug)) {
    return {
      ok: false,
      reason: `"${slug}" is not a valid post slug (lowercase words separated by hyphens).`,
    };
  }
  if (!knownSlugs.has(slug)) {
    return {
      ok: false,
      reason: `No built blog post has the slug "${slug}". Ship the post first, then mark the item published.`,
    };
  }
  return { ok: true, slug };
}

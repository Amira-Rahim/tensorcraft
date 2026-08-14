import { describe, it, expect } from "vitest";
import { resolvePublishSlug } from "./publish-slug";

const KNOWN = new Set(["how-analogies-break", "2026-w18-digest"]);

describe("resolvePublishSlug", () => {
  it("accepts a bare known slug, with surrounding whitespace", () => {
    expect(resolvePublishSlug("how-analogies-break", KNOWN)).toEqual({
      ok: true,
      slug: "how-analogies-break",
    });
    expect(resolvePublishSlug("  2026-w18-digest  ", KNOWN)).toEqual({
      ok: true,
      slug: "2026-w18-digest",
    });
  });

  it("accepts a /blog/ path or a full post URL, ignoring query and hash", () => {
    for (const input of [
      "/blog/how-analogies-break",
      "blog/how-analogies-break/",
      "https://tensorcraft.app/blog/how-analogies-break?utm_source=x#top",
    ]) {
      expect(resolvePublishSlug(input, KNOWN)).toEqual({
        ok: true,
        slug: "how-analogies-break",
      });
    }
  });

  it("rejects empty input", () => {
    const result = resolvePublishSlug("   ", KNOWN);
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed slug and names it in the reason", () => {
    const result = resolvePublishSlug("Not A Slug", KNOWN);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toContain("Not A Slug");
  });

  it("rejects a well-formed slug that no built post has", () => {
    const result = resolvePublishSlug("ghost-post", KNOWN);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.reason).toContain("ghost-post");
  });
});

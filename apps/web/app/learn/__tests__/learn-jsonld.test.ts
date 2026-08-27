import { describe, it, expect } from "vitest";
import { buildLearnBreadcrumbs, buildLearnVideo } from "../learn-jsonld";

describe("buildLearnBreadcrumbs", () => {
  it("emits Home then Learn with absolute urls", () => {
    const crumbs = buildLearnBreadcrumbs();
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    expect(crumbs.itemListElement.map((c) => [c.position, c.item])).toEqual([
      [1, "https://tensorcraft.app"],
      [2, "https://tensorcraft.app/learn"],
    ]);
  });
});

describe("buildLearnVideo", () => {
  it("describes the trailer with absolute asset urls", () => {
    // The page is video-first (2026-08-27): the VideoObject is the page's
    // indexable object and must point at the shipped assets exactly.
    const video = buildLearnVideo();
    expect(video["@type"]).toBe("VideoObject");
    expect(video.contentUrl).toBe(
      "https://tensorcraft.app/media/learn-trailer.mp4",
    );
    expect(video.thumbnailUrl).toEqual([
      "https://tensorcraft.app/media/learn-trailer-poster.webp",
    ]);
    expect(video.duration).toBe("PT1M12S");
    // Query register: schema descriptions say "JavaScript developers".
    expect(video.description).toContain("JavaScript developers");
  });
});

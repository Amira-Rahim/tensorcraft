import { describe, it, expect } from "vitest";
import { WORLD_SLUGS, isLaunched } from "@tensorcraft/shared";
import { worlds } from "@tensorcraft/worlds";
import { buildLearnBreadcrumbs, buildLearnCourseList } from "../learn-jsonld";

/**
 * First structured data on /learn (2026-08-24 redesign). The builders are
 * modules for the same reason course-jsonld.ts is one: async server
 * components do not render under vitest, so inline page JSON-LD ships
 * untested (the R3-7 class of failure).
 */
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

describe("buildLearnCourseList", () => {
  it("lists every world exactly once, in canonical order", () => {
    const list = buildLearnCourseList();
    expect(list["@type"]).toBe("ItemList");
    expect(list.itemListElement).toHaveLength(WORLD_SLUGS.length);
    list.itemListElement.forEach((item, i) => {
      expect(item.position).toBe(i + 1);
      const world = worlds[WORLD_SLUGS[i]];
      expect(item.name).toContain(world?.displayName ?? WORLD_SLUGS[i]);
    });
  });

  it("gives urls to launched worlds only, mirroring the on-page link policy", () => {
    // Coming-soon worlds are inert everywhere (world-cards-grid precedent);
    // a url in structured data for an unlinkable course would be the same
    // overclaim the page test pins against in the DOM.
    const list = buildLearnCourseList();
    list.itemListElement.forEach((item, i) => {
      const slug = WORLD_SLUGS[i];
      if (isLaunched(slug)) {
        expect(item.url).toBe(`https://tensorcraft.app/worlds/${slug}`);
      } else {
        expect(item).not.toHaveProperty("url");
      }
    });
  });

  it("derives membership from isLaunched, so a launch needs no edit here", () => {
    const withUrls = buildLearnCourseList().itemListElement.filter(
      (item) => "url" in item,
    );
    expect(withUrls).toHaveLength(WORLD_SLUGS.filter(isLaunched).length);
  });
});

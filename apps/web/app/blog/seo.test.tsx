import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const content = vi.hoisted(() => ({ getPosts: vi.fn() }));
vi.mock("@tensorcraft/content", () => content);

import BlogIndexPage, { metadata } from "./page";
import { GET } from "./rss.xml/route";

beforeEach(() => {
  content.getPosts.mockReset().mockReturnValue([]);
});

describe("public blog index and feed", () => {
  it("offers the public guides when no articles exist", () => {
    const html = renderToStaticMarkup(<BlogIndexPage />);
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.querySelector('a[href="/guides"]')?.textContent).toBe(
      "JavaScript machine learning guides",
    );
  });

  it("keeps the feed description consistent without promising a publication schedule", async () => {
    const xml = await GET().text();
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.querySelector("channel > description")?.textContent).toBe(
      metadata.description,
    );
    expect(xml).not.toContain("Weekly");
  });
});

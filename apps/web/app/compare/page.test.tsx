import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ComparePage, { metadata } from "./page";
import { ORGANIZATION_ID, WEBSITE_ID } from "@/lib/site-identity";

function renderPage() {
  return new DOMParser().parseFromString(
    renderToStaticMarkup(<ComparePage />),
    "text/html",
  );
}

describe("source-based learning comparison", () => {
  it("names each offering through its primary source and keeps table associations intact", () => {
    const doc = renderPage();
    const headers = [...doc.querySelectorAll("thead th[scope='col']")];
    const offeringLinks = headers
      .slice(1)
      .map((header) => header.querySelector("a")!);

    expect(offeringLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/worlds/deep-orbit",
      "https://www.tensorflow.org/resources/learn-ml/basics-of-tensorflow-for-js-development",
      "https://master.dev/courses/tensorflow-js/",
      "https://course.fast.ai/",
      "https://docs.scrimba.com/ai-engineer-path/",
    ]);
    expect(
      offeringLinks.every((link) => link.textContent!.trim().length > 0),
    ).toBe(true);
    for (const row of doc.querySelectorAll("tbody tr")) {
      expect(row.querySelectorAll("th[scope='row']")).toHaveLength(1);
      expect(row.querySelectorAll("td")).toHaveLength(offeringLinks.length);
    }
    expect(doc.querySelector("[role='region']")?.getAttribute("tabindex")).toBe(
      "0",
    );
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
  });

  it("ties the visible review date and primary sources to the page identity", () => {
    const doc = renderPage();
    const schema = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]')!.textContent!,
    );
    const reviewedAt = doc.querySelector("time")!.getAttribute("datetime");
    expect(schema.dateModified).toBe(reviewedAt);
    expect(reviewedAt).toBe("2026-11-10");
    expect(metadata.openGraph).toMatchObject({ modifiedTime: reviewedAt });
    expect(schema.url).toBe(metadata.alternates?.canonical);
    expect(schema.headline).toBe(doc.querySelector("h1")!.textContent);
    expect(schema.author).toEqual({ "@id": ORGANIZATION_ID });
    expect(schema.publisher).toEqual(schema.author);
    expect(schema.isPartOf).toEqual({ "@id": WEBSITE_ID });
    const visibleHrefs = new Set(
      [...doc.querySelectorAll("a")].map((link) => link.getAttribute("href")),
    );
    expect(schema.citation).toHaveLength(5);
    for (const citation of schema.citation) {
      expect(visibleHrefs.has(citation)).toBe(true);
    }
    expect(doc.querySelector('a[rel="author"]')?.getAttribute("href")).toBe(
      "/about",
    );
  });

  it("links the decision to the free lesson, learning path, project evidence and current offer", () => {
    const doc = renderPage();
    const internalHrefs = new Set(
      [...doc.querySelectorAll('a[href^="/"]')].map((link) =>
        link.getAttribute("href"),
      ),
    );
    for (const href of [
      "/worlds/deep-orbit/foundations/introduction-to-tensors",
      "/guides/javascript-machine-learning-learning-path",
      "/guides/browser-machine-learning-project",
      "/pricing",
    ]) {
      expect(internalHrefs.has(href)).toBe(true);
    }
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import { getModules, getWorldLessons } from "@tensorcraft/content";
import LearningPath, { metadata } from "./page";
import { capture } from "@/lib/posthog";

vi.mock("@/lib/posthog", () => ({ capture: vi.fn() }));

beforeEach(() => {
  vi.mocked(capture).mockClear();
});

function initialDocument() {
  return new DOMParser().parseFromString(
    renderToStaticMarkup(<LearningPath />),
    "text/html",
  );
}

describe("JavaScript ML learning path", () => {
  it("answers the goal question and exposes the learning sequence in initial HTML", () => {
    const doc = initialDocument();
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    const opening = doc.querySelector("article header p")!.textContent!;
    expect(opening).toContain("train a small model");
    expect(opening).toContain("already trained");
    expect(opening).toContain("hosted model API");
    expect(doc.querySelectorAll("#sequence + ol li")).toHaveLength(5);
    expect(doc.body.textContent).toContain("Node.js 22 or later");
    expect(doc.body.textContent).toContain("fictional");
    expect(
      doc.querySelector('a[href="/guides/tensorflow-js-reshape-vs-transpose"]'),
    ).not.toBeNull();
    expect(
      doc.querySelector('a[href="/guides/browser-machine-learning-project"]'),
    ).not.toBeNull();
    expect(
      doc.querySelector('a[href="https://www.tensorflow.org/js/models"]'),
    ).not.toBeNull();
  });

  it("derives all module rows, lesson counts, and free links from the actual launched curriculum", () => {
    const doc = initialDocument();
    const modules = getModules("deep-orbit");
    const lessons = getWorldLessons("deep-orbit");
    const freeModule = modules.find((module) => module.order === 1)!;
    const freeLessons = lessons.filter(
      (lesson) => lesson.moduleId === freeModule.slug,
    );
    expect(doc.body.textContent).toContain(
      `${modules.length} modules and ${lessons.length} lessons`,
    );
    const rows = [...doc.querySelectorAll("tr[data-module]")];
    expect(rows).toHaveLength(modules.length);
    for (const [index, module] of modules.entries()) {
      const row = rows[index];
      expect(row.getAttribute("data-module")).toBe(module.slug);
      expect(row.querySelector("th")!.textContent).toContain(module.title);
      const count = lessons.filter(
        (lesson) => lesson.moduleId === module.slug,
      ).length;
      expect(row.querySelector("th")!.textContent).toContain(
        `${count} lessons.`,
      );
      expect(
        row.querySelector("td")!.textContent!.trim().length,
      ).toBeGreaterThan(20);
      if (module.order === 1) {
        expect(row.textContent).toContain("Free.");
      } else {
        expect(row.textContent).toContain("Paid continuation.");
      }
    }
    const expectedFreeUrls = freeLessons.map(
      (lesson) => `/worlds/deep-orbit/${lesson.moduleId}/${lesson.slug}`,
    );
    const lessonLinks = [
      ...doc.querySelectorAll('a[href^="/worlds/deep-orbit/"]'),
    ];
    expect(lessonLinks.map((link) => link.getAttribute("href"))).toEqual(
      expectedFreeUrls,
    );
    expect(doc.body.textContent).toContain(
      "Later modules require a one-time purchase",
    );
    expect(doc.querySelector('a[href="/pricing#curriculum"]')).not.toBeNull();
  });

  it("matches visible author, update date, and canonical identity in structured data", () => {
    const doc = initialDocument();
    const data = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]')!.textContent!,
    );
    expect(data[0].headline).toBe(doc.querySelector("h1")!.textContent);
    expect(data[0].mainEntityOfPage).toBe(metadata.alternates?.canonical);
    expect(data[0].dateModified).toBe(
      doc.querySelector("time")!.getAttribute("datetime"),
    );
    expect(data[0]).not.toHaveProperty("datePublished");
    expect(data[0].author).toEqual({
      "@id": "https://tensorcraft.app/#organization",
    });
    expect(doc.querySelector('a[rel="author"]')!.textContent).toBe(
      "Tensorcraft",
    );
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: metadata.alternates?.canonical,
    });
  });

  it("identifies the actual free lesson handoff without relabeling external acquisition", () => {
    const freeLesson = getWorldLessons("deep-orbit").find(
      (lesson) => lesson.moduleId === "foundations",
    )!;
    render(<LearningPath />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    event.preventDefault();
    fireEvent(screen.getByRole("link", { name: freeLesson.title }), event);
    expect(capture).toHaveBeenCalledWith("free_lesson_cta_clicked", {
      source: "guide",
      guideSlug: "javascript-machine-learning-learning-path",
      targetLesson: `https://tensorcraft.app/worlds/deep-orbit/${freeLesson.moduleId}/${freeLesson.slug}`,
      placement: "activity",
    });
  });
});

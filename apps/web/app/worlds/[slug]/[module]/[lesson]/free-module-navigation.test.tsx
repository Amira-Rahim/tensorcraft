import { render, screen } from "@testing-library/react";
import { getModuleLessons } from "@tensorcraft/content";
import { describe, expect, it } from "vitest";
import { FreeModuleNavigation } from "./free-module-navigation";

describe("free-module navigation", () => {
  it("links the actual free lessons in order and identifies the current page", () => {
    render(
      <FreeModuleNavigation
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        lessonSlug="tensor-shapes"
      />,
    );
    const nav = screen.getByRole("navigation", {
      name: "Free lessons in Foundations: Tensors & Data",
    });
    const links = [...nav.querySelectorAll("a")];
    const lessons = getModuleLessons("deep-orbit", "foundations");
    expect(links).toHaveLength(5);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      lessons.map((lesson) => `/worlds/deep-orbit/foundations/${lesson.slug}`),
    );
    expect(links.filter((link) => link.hasAttribute("aria-current"))).toEqual([
      screen.getByRole("link", { name: "Understanding Tensor Shapes" }),
    ]);
    expect(
      screen.getByRole("link", { name: "TensorFlow.js reshape vs transpose" }),
    ).toHaveAttribute("href", "/guides/tensorflow-js-reshape-vs-transpose");
  });

  it.each([
    ["deep-orbit", "neural-networks"],
    ["neon-protocol", "foundations"],
  ])(
    "does not present %s/%s as free course navigation",
    (worldSlug, moduleSlug) => {
      const { container } = render(
        <FreeModuleNavigation
          worldSlug={worldSlug}
          moduleSlug={moduleSlug}
          lessonSlug="first-neuron"
        />,
      );
      expect(container).toBeEmptyDOMElement();
    },
  );
});

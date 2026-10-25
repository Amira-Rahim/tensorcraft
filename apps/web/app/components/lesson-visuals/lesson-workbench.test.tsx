import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { lessons } from "@tensorcraft/content";
import { LessonConceptWorkbench, LessonMissionScene } from "./lesson-workbench";
import { LESSON_INVESTIGATIONS } from "./lesson-investigations";

afterEach(cleanup);
const orbit = lessons.filter((lesson) => lesson.worldId === "deep-orbit");

describe("the rendered workbench for every Deep Orbit lesson", () => {
  it.each(orbit)(
    "$slug has independently labelled controls and keeps its scene before its activity",
    (lesson) => {
      const { container } = render(
        <LessonConceptWorkbench
          lesson={lesson}
          worldSlug="deep-orbit"
          moduleSlug={lesson.moduleId}
        />,
      );
      expect(screen.getByTestId("lesson-workbench")).toBeInTheDocument();
      const ids = [...container.querySelectorAll("[id]")].map(
        (element) => element.id,
      );
      expect(new Set(ids).size).toBe(ids.length);
      for (const control of container.querySelectorAll<HTMLInputElement>(
        "input,select,textarea",
      )) {
        expect(
          Boolean(
            control.labels?.length ||
            control.getAttribute("aria-label") ||
            control.getAttribute("aria-labelledby"),
          ),
          `${lesson.slug}: ${control.outerHTML}`,
        ).toBe(true);
      }
      const scene = container.querySelector(".lesson-mission-scene");
      const activity = container.querySelector(
        '[data-testid="lesson-investigation"], [data-testid="channel-layout-experiment"]',
      );
      if (activity) {
        expect(scene).not.toBeNull();
        expect(
          scene!.compareDocumentPosition(activity) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      }
      // The first lesson runs an actual tensor; Shapes has its dedicated activity.
      // Every other lesson must expose its own task before optional references.
      if (!["introduction-to-tensors", "tensor-shapes"].includes(lesson.slug)) {
        expect(
          screen.getByRole("heading", {
            name: LESSON_INVESTIGATIONS[lesson.slug]!.title,
          }),
        ).toBeInTheDocument();
        expect(activity!.closest("details")).toBeNull();
      }
    },
  );

  it("explains every authored location rather than leaking screenplay shorthand into captions", () => {
    const locations = [
      ...new Set(orbit.map((lesson) => lesson.scene!.location)),
    ];
    for (const location of locations) {
      const { container, unmount } = render(
        <LessonMissionScene
          lesson={{
            slug: "caption-check",
            scene: { location },
            context: { narrative: "The crew checks the next recording." },
          }}
          worldSlug="deep-orbit"
          moduleSlug="foundations"
        />,
      );
      const caption = container.querySelector(".mission-context-location")!;
      expect(caption).toHaveTextContent("Archimedes");
      expect(caption.textContent).not.toBe(location);
      expect(caption.textContent!.split(" ").length).toBeGreaterThan(5);
      unmount();
    }
  });

  it("adds each authored scene time to its caption without a stray full stop", () => {
    const timed = orbit.filter((lesson) => lesson.scene?.time);
    expect(timed.length).toBeGreaterThan(0);
    for (const lesson of timed) {
      const { container, unmount } = render(
        <LessonMissionScene
          lesson={{
            slug: "caption-check",
            scene: lesson.scene,
            context: { narrative: "The crew checks the next recording." },
          }}
          worldSlug="deep-orbit"
          moduleSlug="foundations"
        />,
      );
      const caption = container.querySelector(
        ".mission-context-location",
      )!.textContent!;
      expect(caption.toLowerCase(), lesson.slug).toContain(
        lesson.scene!.time!.toLowerCase(),
      );
      // A full stop followed by a comma read "Archimedes., Six hours after
      // first contact" on every timed mission from 2026-10-15.
      expect(caption, lesson.slug).not.toMatch(/[.!?],/);
      unmount();
    }
  });
});

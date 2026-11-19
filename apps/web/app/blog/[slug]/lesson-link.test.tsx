import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LessonLink } from "./lesson-link";
import { track } from "@/lib/analytics-events";

vi.mock("@/lib/analytics-events", () => ({
  EVENTS: { DIGEST_LINK_CLICKED: "digest_link_clicked" },
  track: vi.fn(),
}));

describe("article lesson handoff", () => {
  it("keeps acquisition tags out of internal links and records content context in the event", () => {
    render(
      <LessonLink
        postSlug="sensor-order"
        weekIso="2026-W46"
        worldId="deep-orbit"
        moduleId="foundations"
        slug="tensor-shapes"
        title="Tensor shapes"
      />,
    );
    const link = screen.getByRole("link", { name: "Tensor shapes" });
    expect(link).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/tensor-shapes",
    );
    fireEvent.click(link);
    expect(track).toHaveBeenCalledWith("digest_link_clicked", {
      postSlug: "sensor-order",
      weekIso: "2026-W46",
      worldId: "deep-orbit",
      moduleId: "foundations",
      lessonSlug: "tensor-shapes",
    });
  });
});

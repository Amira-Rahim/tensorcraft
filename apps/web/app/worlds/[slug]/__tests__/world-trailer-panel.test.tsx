import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorldTrailerPanel } from "../world-trailer-panel";
import { capture } from "@/lib/posthog";

// Mock the posthog transport, not analytics-events: mocking the widely
// imported events module with a factory is the exact vi.mock drift trap
// documented after the 2026-08-26 PostHog wiring incident.
vi.mock("@/lib/posthog", () => ({ capture: vi.fn() }));

const baseProps = {
  worldId: "deep-orbit",
  worldName: "Deep Orbit",
  poster: "/media/deep-orbit-trailer-poster.webp",
  src: "/media/deep-orbit-trailer.mp4",
  durationLabel: "1:28",
  freeLessonHref: "/worlds/deep-orbit/foundations/introduction-to-tensors",
};

describe("WorldTrailerPanel", () => {
  beforeEach(() => {
    vi.mocked(capture).mockClear();
  });

  it("rests as a poster button with no dialog and no video element", () => {
    render(<WorldTrailerPanel {...baseProps} />);
    expect(screen.getByTestId("world-trailer-panel")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
  });

  it("opens the lightbox on click and fires world_trailer_played", () => {
    render(<WorldTrailerPanel {...baseProps} />);
    fireEvent.click(screen.getByTestId("world-trailer-panel"));
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Deep Orbit trailer",
    );
    expect(capture).toHaveBeenCalledWith("world_trailer_played", {
      worldId: "deep-orbit",
      mode: "full",
    });
  });

  it("reveals the free-lesson end card only after the film ends", () => {
    render(<WorldTrailerPanel {...baseProps} />);
    fireEvent.click(screen.getByTestId("world-trailer-panel"));
    expect(screen.queryByTestId("trailer-endcard")).not.toBeInTheDocument();

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    fireEvent.ended(video as HTMLVideoElement);

    const cta = screen.getByTestId("world-trailer-endcard-cta");
    expect(cta).toHaveAttribute("href", baseProps.freeLessonHref);
  });

  it("fires the free-lesson event with the end-card source when clicked", () => {
    render(<WorldTrailerPanel {...baseProps} />);
    fireEvent.click(screen.getByTestId("world-trailer-panel"));
    fireEvent.ended(document.querySelector("video") as HTMLVideoElement);
    fireEvent.click(screen.getByTestId("world-trailer-endcard-cta"));
    expect(capture).toHaveBeenCalledWith("free_lesson_cta_clicked", {
      source: "world_trailer_endcard",
    });
  });

  it("hides the end card again if playback restarts", () => {
    render(<WorldTrailerPanel {...baseProps} />);
    fireEvent.click(screen.getByTestId("world-trailer-panel"));
    const video = document.querySelector("video") as HTMLVideoElement;
    fireEvent.ended(video);
    expect(screen.getByTestId("trailer-endcard")).toBeInTheDocument();
    fireEvent.play(video);
    expect(screen.queryByTestId("trailer-endcard")).not.toBeInTheDocument();
  });

  it("closes via the close button", () => {
    render(<WorldTrailerPanel {...baseProps} />);
    fireEvent.click(screen.getByTestId("world-trailer-panel"));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

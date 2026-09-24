import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SceneClip } from "./scene-clip";

vi.mock("@tensorcraft/ui", () => ({
  // className reaches the stub's root as it reaches the real figure, so the
  // fallback's spacing inside the story grid is checkable.
  ScenePortrait: ({ src, className }: { src: string; className?: string }) => (
    <div
      data-testid="scene-portrait-fallback"
      data-src={src}
      className={className}
    />
  ),
}));

vi.mock("@/lib/analytics-events", () => ({
  track: vi.fn(),
  EVENTS: {
    SCENE_CLIP_PLAYED: "scene_clip_played",
    SCENE_CLIP_COMPLETED: "scene_clip_completed",
  },
}));

import { track } from "@/lib/analytics-events";

const props = {
  clipUrl: "https://cdn.example/clip.mp4",
  posterSrc: "/scenes/deep-orbit/foundations/introduction-to-tensors.webp",
  alt: "On the bridge, a holo column of noise.",
  worldId: "deep-orbit",
  lessonId: "introduction-to-tensors",
};

beforeEach(() => {
  vi.mocked(track).mockClear();
  // jsdom has no media engine; play() resolving is the autoplay-granted case.
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

describe("SceneClip", () => {
  it("renders the video with the scene still as poster and the alt as label", () => {
    const { container } = render(
      <SceneClip {...props} autoPlayEligible={false} />,
    );
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("poster", props.posterSrc);
    expect(video).toHaveAttribute("aria-label", props.alt);
    // Silent-film doctrine: muted is non-negotiable.
    expect(video?.muted).toBe(true);
  });

  it("is a playback beat like the still it replaces", () => {
    render(<SceneClip {...props} autoPlayEligible={false} />);
    expect(screen.getByTestId("scene-clip")).toHaveAttribute(
      "data-script-beat",
    );
  });

  it("autoplays and reports trigger=auto when eligible", async () => {
    render(<SceneClip {...props} autoPlayEligible />);
    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "scene_clip_played",
        expect.objectContaining({ trigger: "auto" }),
      );
    });
  });

  it("offers a manual play control when not eligible (skip memory, reduced motion)", async () => {
    render(<SceneClip {...props} autoPlayEligible={false} />);
    expect(track).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /play scene clip/i }));
    await vi.waitFor(() => {
      expect(track).toHaveBeenCalledWith(
        "scene_clip_played",
        expect.objectContaining({ trigger: "manual" }),
      );
    });
  });

  it("falls back to the still on a media error, exactly the pre-video Briefing", () => {
    const { container } = render(
      <SceneClip {...props} autoPlayEligible={false} />,
    );
    fireEvent.error(container.querySelector("video")!);
    expect(screen.getByTestId("scene-portrait-fallback")).toHaveAttribute(
      "data-src",
      props.posterSrc,
    );
    // 16 px above the stage direction, like the Briefing still and the
    // video, rather than the portrait's default 28 px.
    expect(screen.getByTestId("scene-portrait-fallback")).toHaveClass("mb-4");
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("reports completion with the watched duration", () => {
    const { container } = render(
      <SceneClip {...props} autoPlayEligible={false} />,
    );
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "currentTime", { value: 10, writable: true });
    fireEvent.ended(video);
    expect(track).toHaveBeenCalledWith(
      "scene_clip_completed",
      expect.objectContaining({ watchedMs: 10000 }),
    );
  });
});

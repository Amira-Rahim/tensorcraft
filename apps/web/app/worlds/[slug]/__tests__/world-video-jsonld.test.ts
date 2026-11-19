import { describe, it, expect, vi } from "vitest";
import { worlds } from "@tensorcraft/worlds";
import { buildWorldVideoJsonLd } from "../world-video-jsonld";
import { worldTrailer, type WorldTrailer } from "@/lib/world-trailer";

vi.mock("node:fs", () => ({ default: { existsSync: () => true } }));

const trailer: WorldTrailer = {
  poster: "/media/deep-orbit-trailer-poster.webp",
  full: "/media/deep-orbit-trailer.mp4",
  durationSeconds: 88,
  durationIso: "PT1M28S",
  durationLabel: "1:28",
  uploadDate: "2026-08-29T14:31:46Z",
};

describe("buildWorldVideoJsonLd", () => {
  const video = buildWorldVideoJsonLd(worlds["deep-orbit"], trailer);

  it("is a standalone VideoObject addressing the film on the canonical host", () => {
    expect(video["@type"]).toBe("VideoObject");
    expect(video.contentUrl).toBe(
      "https://tensorcraft.app/media/deep-orbit-trailer.mp4",
    );
    expect(video.thumbnailUrl).toEqual([
      "https://tensorcraft.app/media/deep-orbit-trailer-poster.webp",
    ]);
  });

  it("keeps duration and uploadDate in sync with the resolver, not hardcoded", () => {
    // /learn once declared PT1M12S against a longer film; this builder
    // reads the resolver so the schema can never contradict the mp4.
    expect(video.duration).toBe(trailer.durationIso);
    expect(video.uploadDate).toBe(trailer.uploadDate);
    expect(video.description).toContain("88-second");
  });

  it("publishes the recorded production time with a timezone", () => {
    const shippedTrailer = worldTrailer("deep-orbit");
    expect(shippedTrailer).toBeDefined();
    const publishedVideo = buildWorldVideoJsonLd(
      worlds["deep-orbit"],
      shippedTrailer!,
    );
    expect(publishedVideo.uploadDate).toBe("2026-08-29T14:31:46Z");
    expect(new Date(publishedVideo.uploadDate).toISOString()).toBe(
      "2026-08-29T14:31:46.000Z",
    );
  });

  it("describes the course in plain language with no story hook", () => {
    // Search snippets reach strangers with no framing (owner bar
    // 2026-08-16): the story stays off structured data.
    expect(video.description).toContain("Module 1 is free");
    expect(video.description).not.toMatch(/signal|crew|Archimedes|station/i);
  });

  it("never points at /learn's film: the two videos stay distinct in search", () => {
    expect(video.contentUrl).not.toContain("learn-trailer");
    expect(video.thumbnailUrl[0]).not.toContain("learn-trailer");
  });
});

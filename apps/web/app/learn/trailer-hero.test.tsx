import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { TrailerHero } from "./trailer-hero";
import { INTRO_VIDEO } from "@/lib/intro-video";
import { capture } from "@/lib/posthog";

vi.mock("@/lib/posthog", () => ({ capture: vi.fn() }));

const originalConnection = Object.getOwnPropertyDescriptor(
  navigator,
  "connection",
);

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData: false },
  });
  vi.mocked(capture).mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalConnection) {
    Object.defineProperty(navigator, "connection", originalConnection);
  } else {
    Reflect.deleteProperty(navigator, "connection");
  }
});

describe("discoverable introduction preview", () => {
  it("keeps the poster visible without starting media until the delay ends", () => {
    const { container } = render(<TrailerHero />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("src", INTRO_VIDEO.src);
    expect(video).toHaveAttribute("poster", INTRO_VIDEO.poster);
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5999);
    });
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(container.querySelector("video")).toBe(video);
  });

  it("allows early interaction and records playback only after playing", () => {
    const { container } = render(<TrailerHero />);
    fireEvent.pointerMove(window);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(capture).not.toHaveBeenCalled();
    fireEvent.playing(container.querySelector("video")!);
    fireEvent.playing(container.querySelector("video")!);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("learn_trailer_played", {
      mode: "loop",
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it.each(["reduced motion", "Save-Data"])(
    "keeps %s visitors on the poster until explicit playback",
    (preference) => {
      if (preference === "reduced motion") {
        vi.stubGlobal(
          "matchMedia",
          vi.fn(() => ({ matches: true })),
        );
      } else {
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: { saveData: true },
        });
      }
      const { container } = render(<TrailerHero />);
      const preview = container.querySelector("video")!;
      fireEvent.pointerMove(window);
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
      expect(preview).toHaveAttribute("poster", INTRO_VIDEO.poster);

      fireEvent.click(
        screen.getByRole("button", { name: "Play the trailer with sound" }),
      );
      const dialog = screen.getByRole("dialog", {
        name: "Tensorcraft introduction",
      });
      expect(dialog.querySelector("video")).toHaveAttribute("autoplay");
      expect(dialog.querySelector("video")).toHaveAttribute("controls");
      expect(dialog.querySelector('track[kind="captions"]')).toHaveAttribute(
        "src",
        INTRO_VIDEO.captions,
      );
    },
  );

  it("pauses the silent loop while the full player is open and resumes on close", () => {
    render(<TrailerHero />);
    fireEvent.pointerMove(window);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Play the trailer with sound" }),
    );
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("learn_trailer_played", {
      mode: "full",
    });
    fireEvent.click(screen.getByRole("button", { name: /Close/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it("keeps explicit playback available when automatic playback fails", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException("Autoplay blocked", "NotAllowedError"),
    );
    render(<TrailerHero />);
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Play the trailer with sound" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Tensorcraft introduction" }),
    ).toBeInTheDocument();
  });
});

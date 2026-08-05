import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AriaWaveformAvatar } from "./aria-waveform";
import type { SceneCanvasProps } from "./scene-canvas";

/* Consumer-level convention (see lesson-steps tests): SceneCanvas is stubbed
   out, jsdom has no canvas backend. The stub captures props so draw identity
   and palette plumbing stay observable. */

const captured: SceneCanvasProps[] = [];
vi.mock("./scene-canvas", () => ({
  SceneCanvas: (props: SceneCanvasProps) => {
    captured.push(props);
    return <div data-testid="scene-canvas-stub" />;
  },
}));

describe("AriaWaveformAvatar", () => {
  it("names the frame, keeps the canvas layer decorative", () => {
    const { container } = render(<AriaWaveformAvatar rgb={[107, 170, 138]} />);
    const frame = screen.getByTestId("aria-waveform-avatar");
    expect(frame).toHaveAttribute("role", "img");
    expect(frame).toHaveAttribute("aria-label", "ARIA");
    const canvasBox = container.querySelector("[aria-hidden='true']");
    expect(canvasBox).not.toBeNull();
    expect(screen.getByTestId("scene-canvas-stub")).toBeInTheDocument();
  });

  it("applies the square avatar frame chrome at the requested size", () => {
    render(<AriaWaveformAvatar rgb={[107, 170, 138]} size={30} />);
    const frame = screen.getByTestId("aria-waveform-avatar");
    expect(frame.style.width).toBe("30px");
    expect(frame.style.height).toBe("30px");
    expect(frame.style.borderRadius).toBe("0px");
    expect(frame.style.border).toContain("2px solid");
  });

  it("passes rgb, rgbLight and a resting intensity to SceneCanvas", () => {
    captured.length = 0;
    render(
      <AriaWaveformAvatar rgb={[107, 170, 138]} rgbLight={[59, 101, 80]} />,
    );
    expect(captured[0]?.rgb).toEqual([107, 170, 138]);
    expect(captured[0]?.rgbLight).toEqual([59, 101, 80]);
    expect(captured[0]?.intensity).toBe(0.6);
  });

  it("keeps a stable draw identity across re-renders with the same state", () => {
    captured.length = 0;
    const { rerender } = render(
      <AriaWaveformAvatar rgb={[107, 170, 138]} state="alarm" />,
    );
    rerender(<AriaWaveformAvatar rgb={[107, 170, 138]} state="alarm" />);
    expect(captured.length).toBe(2);
    expect(captured[1]?.draw).toBe(captured[0]?.draw);
  });

  it("swaps the draw when the state changes", () => {
    captured.length = 0;
    const { rerender } = render(
      <AriaWaveformAvatar rgb={[107, 170, 138]} state="neutral" />,
    );
    rerender(<AriaWaveformAvatar rgb={[107, 170, 138]} state="deadpan" />);
    expect(captured[1]?.draw).not.toBe(captured[0]?.draw);
  });

  it("accepts a custom accessible name", () => {
    render(<AriaWaveformAvatar rgb={[107, 170, 138]} name="ARIA (ship AI)" />);
    expect(screen.getByTestId("aria-waveform-avatar")).toHaveAttribute(
      "aria-label",
      "ARIA (ship AI)",
    );
  });
});

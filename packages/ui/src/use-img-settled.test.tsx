import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useImgSettled } from "./use-img-settled";

/* jsdom never settles images on its own (complete stays false with a src
   set), so the pre-hydration scenarios are driven with stub elements. */

const settledImg = (naturalWidth: number) =>
  ({ complete: true, naturalWidth }) as HTMLImageElement;

describe("useImgSettled", () => {
  it("reports failure for an image that 404'd before hydration", () => {
    const onSettled = vi.fn();
    renderHook(() =>
      useImgSettled({ current: settledImg(0) }, "/x.webp", onSettled),
    );
    expect(onSettled).toHaveBeenCalledWith(false);
  });

  it("reports success for an image that loaded before hydration", () => {
    const onSettled = vi.fn();
    renderHook(() =>
      useImgSettled({ current: settledImg(512) }, "/x.webp", onSettled),
    );
    expect(onSettled).toHaveBeenCalledWith(true);
  });

  it("stays quiet while the image is still in flight", () => {
    const onSettled = vi.fn();
    renderHook(() =>
      useImgSettled(
        { current: { complete: false, naturalWidth: 0 } as HTMLImageElement },
        "/x.webp",
        onSettled,
      ),
    );
    expect(onSettled).not.toHaveBeenCalled();
  });

  it("stays quiet without an element or src", () => {
    const onSettled = vi.fn();
    renderHook(() => useImgSettled({ current: null }, "/x.webp", onSettled));
    renderHook(() =>
      useImgSettled({ current: settledImg(0) }, undefined, onSettled),
    );
    expect(onSettled).not.toHaveBeenCalled();
  });
});

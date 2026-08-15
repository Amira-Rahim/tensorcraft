import { describe, it, expect } from "vitest";
import { patchSrc, sealSrc } from "./patch-art";

describe("patch art resolution", () => {
  it("mints patch URLs only for worlds with patch art", () => {
    expect(patchSrc("deep-orbit", "foundations")).toBe(
      "/patches/deep-orbit/foundations.webp",
    );
    expect(patchSrc("neon-protocol", "foundations")).toBeUndefined();
    expect(patchSrc("not-a-world", "foundations")).toBeUndefined();
  });

  it("mints the seal URL only for worlds with patch art", () => {
    expect(sealSrc("deep-orbit")).toBe("/seals/deep-orbit.webp");
    expect(sealSrc("terra-grid")).toBeUndefined();
  });
});

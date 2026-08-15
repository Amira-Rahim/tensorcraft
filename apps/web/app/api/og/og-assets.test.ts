import { describe, it, expect } from "vitest";
import { ogPlatePath, ogSealPath } from "./og-assets";

describe("og asset resolution", () => {
  it("resolves the deep-orbit hero plate JPEG", () => {
    expect(ogPlatePath("deep-orbit")).toBe("/og/deep-orbit/bridge.jpg");
  });

  it("resolves nothing for worlds without art", () => {
    expect(ogPlatePath("terra-grid")).toBeUndefined();
    expect(ogPlatePath("not-a-world")).toBeUndefined();
  });

  it("resolves the seal JPEG only for worlds with art", () => {
    expect(ogSealPath("deep-orbit")).toBe("/og/deep-orbit/seal.jpg");
    expect(ogSealPath("nova-canvas")).toBeUndefined();
  });
});

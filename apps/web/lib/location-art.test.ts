import { describe, it, expect } from "vitest";
import { heroPlateSrc } from "./location-art";

describe("heroPlateSrc", () => {
  it("resolves Deep Orbit to its Bridge plate", () => {
    expect(heroPlateSrc("deep-orbit")).toBe(
      "/locations/deep-orbit/bridge.webp",
    );
  });

  it("returns undefined for a world with no art, so consumers degrade", () => {
    expect(heroPlateSrc("neon-protocol")).toBeUndefined();
  });

  it("returns undefined for an unknown slug rather than minting a 404 URL", () => {
    expect(heroPlateSrc("not-a-world")).toBeUndefined();
  });
});

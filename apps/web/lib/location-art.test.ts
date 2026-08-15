import { describe, it, expect } from "vitest";
import {
  heroPlateSrc,
  surfacePlateSrc,
  type PlateSurface,
} from "./location-art";

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

describe("surfacePlateSrc", () => {
  it("resolves the three deep-orbit surfaces to their plates", () => {
    expect(surfacePlateSrc("deep-orbit", "dashboard")).toBe(
      "/locations/deep-orbit/dashboard-station.webp",
    );
    expect(surfacePlateSrc("deep-orbit", "auth")).toBe(
      "/locations/deep-orbit/lab.webp",
    );
    expect(surfacePlateSrc("deep-orbit", "purchase-success")).toBe(
      "/locations/deep-orbit/engineering.webp",
    );
  });

  it("resolves nothing for worlds without art or unknown surfaces", () => {
    expect(surfacePlateSrc("neon-protocol", "dashboard")).toBeUndefined();
    expect(
      surfacePlateSrc("deep-orbit", "landing" as PlateSurface),
    ).toBeUndefined();
  });
});

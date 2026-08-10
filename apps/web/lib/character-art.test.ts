import { describe, it, expect } from "vitest";
import { deepOrbit } from "@tensorcraft/themes";
import { hexToRgb, portraitSources, resolveCharacter } from "./character-art";

const farah = deepOrbit.characters.find((c) => c.slug === "dr-farah")!;
const aria = deepOrbit.characters.find((c) => c.slug === "aria")!;

describe("resolveCharacter", () => {
  it("matches a speaker by manifest name", () => {
    expect(resolveCharacter("deep-orbit", "Dr. Farah")).toBe(farah);
  });

  it("returns undefined for unregistered speakers (extras' Instructor)", () => {
    expect(resolveCharacter("deep-orbit", "Instructor")).toBeUndefined();
  });

  it("returns undefined for unknown themes and missing speakers", () => {
    expect(resolveCharacter("neon-wrong", "Dr. Farah")).toBeUndefined();
    expect(resolveCharacter("deep-orbit", undefined)).toBeUndefined();
  });
});

describe("portraitSources", () => {
  it("builds the base portrait URL from the bible convention", () => {
    expect(portraitSources("deep-orbit", farah)).toEqual({
      src: "/characters/deep-orbit/dr-farah.webp",
    });
  });

  it("adds the variant URL for a canonical expression", () => {
    expect(portraitSources("deep-orbit", farah, "delighted")).toEqual({
      src: "/characters/deep-orbit/dr-farah.webp",
      expressionSrc: "/characters/deep-orbit/dr-farah-delighted.webp",
    });
  });

  it("never mints a URL for unknown or neutral expressions", () => {
    expect(
      portraitSources("deep-orbit", farah, "smoldering").expressionSrc,
    ).toBeUndefined();
    expect(
      portraitSources("deep-orbit", farah, "neutral").expressionSrc,
    ).toBeUndefined();
  });

  it("resolves to nothing without a character or slug", () => {
    expect(portraitSources("deep-orbit", undefined)).toEqual({});
  });
});

describe("hexToRgb", () => {
  it("parses the deep-orbit primaries", () => {
    expect(hexToRgb("#6baa8a")).toEqual([107, 170, 138]);
    expect(hexToRgb("#3B6550")).toEqual([59, 101, 80]);
  });
});

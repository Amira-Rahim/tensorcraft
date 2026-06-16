import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const bible = fs.readFileSync(
  path.resolve(__dirname, "../../../docs/character-bible.md"),
  "utf-8",
);

describe("character bible", () => {
  it("defines the shared cel-shaded style token", () => {
    expect(bible.toLowerCase()).toContain("cel-shaded");
  });
  it.each([
    "commander-mirza",
    "dr-farah",
    "chief-nazari",
    "ensign-demir",
    "aria",
  ])("has a sheet for deep-orbit character %s", (slug) => {
    expect(bible).toContain(slug);
  });
  it("has no em dashes", () => {
    expect(bible).not.toContain("—");
  });
});

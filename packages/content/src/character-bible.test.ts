import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { deepOrbit } from "@tensorcraft/worlds";

const bible = fs.readFileSync(
  path.resolve(__dirname, "../../../docs/character-bible.md"),
  "utf-8",
);

/** Extracts a character's `### ` sheet section by its backticked slug line. */
function sheetFor(slug: string): string {
  const sheet = bible.split(/^### /m).find((s) => s.includes(`\`${slug}\``));
  if (!sheet) throw new Error(`No bible sheet found for '${slug}'`);
  return sheet;
}

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
    expect(bible).not.toContain("\u2014");
  });
});

describe("manifest expressions cross-check", () => {
  // The bible writes ids in prose with spaces ("grudging respect") while the
  // manifest uses kebab-case ("grudging-respect"); normalize before matching.
  const withExpressions = deepOrbit.characters.filter((c) => c.expressions);

  it("deep-orbit has characters with expression sets", () => {
    expect(withExpressions.length).toBeGreaterThan(0);
  });

  it.each(withExpressions.map((c) => [c.slug!, c] as const))(
    "every %s expression id appears in that character's bible sheet",
    (slug, character) => {
      const sheet = sheetFor(slug);
      for (const id of character.expressions!) {
        if (id === "neutral") continue;
        expect(sheet, `'${id}' missing from ${slug} sheet`).toContain(
          id.replace(/-/g, " "),
        );
      }
    },
  );
});

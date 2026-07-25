import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { BRIDGES, THEME_CONTENT } from "@tensorcraft/shared";
import { BUILT_STORY_THEMES } from "../src/built-themes";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import {
  CONTENT_ROOT,
  lessonFiles,
} from "../../../scripts/audit-structure-variety.mjs";

/**
 * Bridge "breaks" coverage gate (P4 round 3, 2026-07-13; un-anchored from
 * deep-orbit 2026-07-25, fresh-eyes rerun T2-23).
 *
 * /learn promises the analogies are "each labeled where it breaks". The
 * audit found 7 of 55 bridges rendered no "Where the analogy ends" panel
 * because they had neither an inline `breaks:` nor a registry match carrying
 * one. This gate replays the SAME resolution the component uses
 * (bridge-callout.tsx: inline breaks, else registry entry matched on
 * feTitle/mlTitle) over every lesson of EVERY built story theme — adding a
 * theme to BUILT_THEME_DIRS extends the gate automatically instead of
 * silently exempting the new corpus (the old version hardcoded deep-orbit
 * and the literal 55).
 */

interface LessonBridge {
  lesson: string;
  feTitle: string;
  mlTitle: string;
  inlineBreaks: boolean;
}

function parseBridge(themeDir: string, file: string): LessonBridge | null {
  const source = readFileSync(file, "utf8");
  const fm = source.match(/^---\n([\s\S]*?)\n---\n?/)?.[1] ?? "";
  const block = fm.match(/^ {2}bridge:\n((?: {4}.*\n)+)/m)?.[1];
  if (!block) return null;
  const field = (key: string) =>
    block.match(new RegExp(`^ {4}${key}: "(.*)"$`, "m"))?.[1];
  return {
    lesson: relative(themeDir, file).replace(/\.mdx$/, ""),
    feTitle: field("feTitle") ?? "",
    mlTitle: field("mlTitle") ?? "",
    inlineBreaks: /^ {4}breaks: /m.test(block),
  };
}

for (const theme of BUILT_STORY_THEMES) {
  const themeDir = join(CONTENT_ROOT, theme);
  const bridges = lessonFiles(themeDir)
    .map((f: string) => parseBridge(themeDir, f))
    .filter((b: LessonBridge | null): b is LessonBridge => b !== null);

  describe(`bridge breaks coverage (${theme})`, () => {
    if (theme === "deep-orbit") {
      it("the marketing bridge count matches the corpus (single-sourced constant)", () => {
        expect(bridges.length).toBe(THEME_CONTENT.lessonBridges);
        expect(bridges.length).toBe(55);
      });
    } else {
      it("the theme ships at least one bridge (empty corpus = mis-wired glob)", () => {
        expect(bridges.length).toBeGreaterThan(0);
      });
    }

    it("every bridge resolves a breaks label via the component's own logic", () => {
      const unlabeled = bridges
        .filter((b) => {
          if (b.inlineBreaks) return false;
          const shared = BRIDGES.find(
            (s) =>
              s.feConcept.toLowerCase() === b.feTitle.toLowerCase() ||
              s.mlConcept.toLowerCase() === b.mlTitle.toLowerCase(),
          );
          return !shared?.breaks;
        })
        .map((b) => b.lesson);
      expect(unlabeled).toEqual([]);
    });
  });
}

import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { BRIDGES, WORLD_CONTENT } from "@tensorcraft/shared";
import { BUILT_STORY_WORLDS } from "../src/built-worlds";
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
 * jsTitle/mlTitle) over every lesson of EVERY built story world - adding a
 * world to BUILT_WORLD_DIRS extends the gate automatically instead of
 * silently exempting the new corpus (the old version hardcoded deep-orbit
 * and the literal 55).
 */

interface LessonBridge {
  lesson: string;
  jsTitle: string;
  mlTitle: string;
  inlineBreaks: boolean;
}

function parseBridge(worldDir: string, file: string): LessonBridge | null {
  const source = readFileSync(file, "utf8");
  const fm = source.match(/^---\n([\s\S]*?)\n---\n?/)?.[1] ?? "";
  const block = fm.match(/^ {2}bridge:\n((?: {4}.*\n)+)/m)?.[1];
  if (!block) return null;
  const field = (key: string) =>
    block.match(new RegExp(`^ {4}${key}: "(.*)"$`, "m"))?.[1];
  return {
    lesson: relative(worldDir, file).replace(/\.mdx$/, ""),
    jsTitle: field("jsTitle") ?? "",
    mlTitle: field("mlTitle") ?? "",
    inlineBreaks: /^ {4}breaks: /m.test(block),
  };
}

for (const world of BUILT_STORY_WORLDS) {
  const worldDir = join(CONTENT_ROOT, world);
  const bridges = lessonFiles(worldDir)
    .map((f: string) => parseBridge(worldDir, f))
    .filter((b: LessonBridge | null): b is LessonBridge => b !== null);

  describe(`bridge breaks coverage (${world})`, () => {
    if (world === "deep-orbit") {
      it("the marketing bridge count matches the corpus (single-sourced constant)", () => {
        expect(bridges.length).toBe(WORLD_CONTENT.lessonBridges);
        expect(bridges.length).toBe(55);
      });
    } else {
      it("the world ships at least one bridge (empty corpus = mis-wired glob)", () => {
        expect(bridges.length).toBeGreaterThan(0);
      });
    }

    it("every bridge resolves a breaks label via the component's own logic", () => {
      const unlabeled = bridges
        .filter((b) => {
          if (b.inlineBreaks) return false;
          const shared = BRIDGES.find(
            (s) =>
              s.jsConcept.toLowerCase() === b.jsTitle.toLowerCase() ||
              s.mlConcept.toLowerCase() === b.mlTitle.toLowerCase(),
          );
          return !shared?.breaks;
        })
        .map((b) => b.lesson);
      expect(unlabeled).toEqual([]);
    });
  });
}

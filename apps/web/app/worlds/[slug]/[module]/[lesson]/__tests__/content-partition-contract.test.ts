/**
 * Content-partition contract (re-audit 2026-09-04).
 *
 * The prose partition renders each lesson step from per-step visibility
 * sets plus CSS zone rules anchored on the first heading, the Challenge
 * heading, and the hidden LessonRecap's marker. That machinery is only
 * correct against CONTENT INVARIANTS this test enforces over every
 * launched lesson MDX file. The first partition shipped without it and
 * silently deleted 11 mid-lesson story beats in 9 live lessons: unit
 * tests mocked the content, so nothing content-shaped could fail.
 *
 * If one of these assertions fails, either the new lesson violates the
 * partition's assumptions (move the content) or the partition needs a new
 * home for the shape (extend the sets/CSS in lesson-steps.tsx and
 * globals.css TOGETHER, then update this contract).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STEP_VISIBILITY } from "../lesson-steps";

const CONTENT_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../../../../packages/content/content/deep-orbit",
);

interface Zones {
  file: string;
  /** Top-level component names before the first h2/h3 (story zone). */
  storyZone: string[];
  /** Top-level component names between the first heading and Challenge. */
  teachingZone: string[];
  /** Top-level component names after "## Challenge", outside <Epilogue>. */
  challengeZone: string[];
  /** Component names inside an <Epilogue> block (visibility-exempt). */
  epilogueZone: string[];
}

function zonesOf(file: string, src: string): Zones {
  const zones: Zones = {
    file,
    storyZone: [],
    teachingZone: [],
    challengeZone: [],
    epilogueZone: [],
  };
  let seenHeading = false;
  let seenChallenge = false;
  let inEpilogue = false;
  // Frontmatter off; component detection is top-of-line JSX in MDX bodies.
  const body = src.replace(/^---[\s\S]*?\n---\n/, "");
  for (const line of body.split("\n")) {
    if (/^## Challenge\b/.test(line)) {
      seenChallenge = true;
      seenHeading = true;
      continue;
    }
    if (/^##+ /.test(line)) {
      seenHeading = true;
      continue;
    }
    if (/^<Epilogue>/.test(line)) {
      inEpilogue = true;
      continue;
    }
    if (/^<\/Epilogue>/.test(line)) {
      inEpilogue = false;
      continue;
    }
    const m = /^<([A-Z][A-Za-z]*)/.exec(line);
    if (!m) continue;
    const name = m[1];
    if (inEpilogue) zones.epilogueZone.push(name);
    else if (seenChallenge) zones.challengeZone.push(name);
    else if (seenHeading) zones.teachingZone.push(name);
    else zones.storyZone.push(name);
  }
  return zones;
}

const lessonFiles: string[] = [];
for (const mod of readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
  if (!mod.isDirectory()) continue;
  for (const f of readdirSync(join(CONTENT_ROOT, mod.name))) {
    if (/^\d+-.*\.mdx$/.test(f)) {
      lessonFiles.push(join(mod.name, f));
    }
  }
}

const allZones = lessonFiles.map((rel) =>
  zonesOf(rel, readFileSync(join(CONTENT_ROOT, rel), "utf8")),
);

const renderableSomewhere = new Set<string>();
for (const set of Object.values(STEP_VISIBILITY)) {
  for (const name of set) renderableSomewhere.add(name);
}

describe("content-partition contract (all launched Deep Orbit lessons)", () => {
  it("found the launched corpus", () => {
    expect(lessonFiles.length).toBe(56);
  });

  it("every top-level component outside an Epilogue is renderable on at least one step", () => {
    const orphans: string[] = [];
    for (const z of allZones) {
      for (const name of [
        ...z.storyZone,
        ...z.teachingZone,
        ...z.challengeZone,
      ]) {
        if (!renderableSomewhere.has(name)) {
          orphans.push(`${z.file}: <${name}>`);
        }
      }
    }
    expect(orphans, `components that would render on NO step`).toEqual([]);
  });

  it("mid-lesson story beats (teaching-zone Dialogue) have a home on the Concept step", () => {
    const midLessonDialogues = allZones.filter((z) =>
      z.teachingZone.includes("Dialogue"),
    );
    // 9 lessons carry them today; the partition must keep a home for them.
    expect(midLessonDialogues.length).toBeGreaterThan(0);
    expect(STEP_VISIBILITY.CONCEPT_LEFT.has("Dialogue")).toBe(true);
  });

  it("story components never appear in the challenge zone (they would render on no step there)", () => {
    const strays = allZones
      .filter(
        (z) =>
          z.challengeZone.includes("Dialogue") ||
          z.challengeZone.includes("BossBeat"),
      )
      .map((z) => z.file);
    expect(
      strays,
      "move the beat before ## Challenge or into <Epilogue>",
    ).toEqual([]);
  });

  it("BossBeat stays in the story zone (the Briefing is its only home)", () => {
    const strays = allZones
      .filter((z) => z.teachingZone.includes("BossBeat"))
      .map((z) => z.file);
    expect(
      strays,
      "a teaching-zone BossBeat is hidden on the Briefing by hideTeaching and renders on no step; add BossBeat to CONCEPT_LEFT alongside Dialogue if this becomes a real pattern",
    ).toEqual([]);
  });

  it("cold-open code (story-zone CodeBlock) is renderable on the Briefing", () => {
    const coldOpens = allZones.filter((z) => z.storyZone.includes("CodeBlock"));
    expect(coldOpens.length).toBeGreaterThan(0);
    expect(STEP_VISIBILITY.BRIEFING_COMPONENTS.has("CodeBlock")).toBe(true);
  });

  it("every lesson carries exactly one LessonRecap (the recap-boundary marker the CSS anchors on)", () => {
    const wrong = allZones
      .map((z) => ({
        file: z.file,
        count: [...z.challengeZone, ...z.teachingZone, ...z.storyZone].filter(
          (n) => n === "LessonRecap",
        ).length,
      }))
      .filter((z) => z.count !== 1)
      .map((z) => `${z.file} (${z.count})`);
    expect(wrong).toEqual([]);
  });
});

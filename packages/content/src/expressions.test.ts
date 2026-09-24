import { describe, it, expect } from "vitest";
import { deepOrbit } from "@tensorcraft/worlds";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../content");

function lessonMdx(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "exercises") continue;
      out.push(...lessonMdx(full));
    } else if (e.name.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

interface DialogueTag {
  file: string;
  speaker?: string;
  expression?: string;
}

/**
 * Opening <Dialogue ...> tags, attributes possibly spanning lines. Attribute
 * values never contain ">" in this corpus (every speaker in the compiled
 * body is a plain quoted name), so [^>]* is safe.
 */
function dialogueTags(files: string[]): DialogueTag[] {
  const tags: DialogueTag[] = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf-8");
    for (const m of src.matchAll(/<Dialogue\b([^>]*)>/g)) {
      const attrs = m[1]!;
      tags.push({
        file: path.relative(ROOT, file),
        speaker: attrs.match(/\bspeaker\s*=\s*"((?:[^"\\]|\\.)*)"/)?.[1],
        expression: attrs.match(/\bexpression\s*=\s*"((?:[^"\\]|\\.)*)"/)?.[1],
      });
    }
  }
  return tags;
}

const deepOrbitTags = dialogueTags(lessonMdx(path.join(ROOT, "deep-orbit")));

function characterFor(speaker: string | undefined) {
  if (!speaker) return undefined;
  return deepOrbit.characters.find(
    (c) => c.name === speaker || c.aliases?.includes(speaker),
  );
}

describe("dialogue expression annotations (deep-orbit)", () => {
  it("found the dialogue corpus (guards the tag regex)", () => {
    expect(deepOrbitTags.length).toBeGreaterThan(100);
  });

  it("the annotation pass is present in the corpus", () => {
    // The 2026-08-15 pass activated the shipped expression variants. A
    // sweep that strips the attributes would pass the per-annotation checks
    // vacuously; this pins the feature as in-use.
    expect(deepOrbitTags.some((t) => t.expression !== undefined)).toBe(true);
  });

  it("every annotated expression belongs to the speaker's manifest set", () => {
    for (const tag of deepOrbitTags) {
      if (tag.expression === undefined) continue;
      const ch = characterFor(tag.speaker);
      expect(
        ch,
        `${tag.file}: expression="${tag.expression}" on unresolvable speaker "${tag.speaker}"`,
      ).toBeDefined();
      expect(
        ch!.expressions ?? [],
        `${tag.file}: "${tag.expression}" is not a canonical expression of ${ch!.name}`,
      ).toContain(tag.expression);
    }
  });
});

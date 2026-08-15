import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const CONTENT = path.resolve(__dirname, "../content");
const PATCHES = path.resolve(__dirname, "../../../apps/web/public/patches");

/**
 * A partial patch set must not ship silently (docs/patch-bible.md): if a
 * world has any patch art, every module of that world has a patch. Worlds
 * with no patch directory pass vacuously; components fall back to their
 * status glyphs.
 */
describe("patch art coverage (all-or-none per world)", () => {
  const worlds = fs
    .readdirSync(CONTENT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const world of worlds) {
    const patchDir = path.join(PATCHES, world);
    if (!fs.existsSync(patchDir)) continue;

    it(`${world}: every module has a patch, no stray patch files`, () => {
      const modules = fs
        .readdirSync(path.join(CONTENT, world), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
      const patches = fs
        .readdirSync(patchDir)
        .filter((n) => n.endsWith(".webp"))
        .map((n) => n.replace(/\.webp$/, ""))
        .sort();
      expect(patches).toEqual(modules);
    });
  }

  it("registers at least the content worlds (guards the directory walk)", () => {
    expect(worlds.length).toBeGreaterThan(0);
  });
});

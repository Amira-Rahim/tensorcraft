import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain .mjs module without type declarations
import { CONTENT_DIR } from "../../../scripts/audit-structure-variety.mjs";

/**
 * Exercise-slug reference gate (editorial audit, 2026-08-19).
 *
 * The lesson page resolves `<Exercise slug="..." />` against the exercise
 * YAML in the same module; a miss renders the "exercise not found" fallback
 * card. Nothing validated the references, and the editorial audit found two
 * shipped-broken slugs in signal-ward (transformers-bert, qa-rag) plus the
 * orphaned YAML files they were meant to mount. This gate closes that class
 * both ways: every referenced slug must exist, and every authored exercise
 * must be mounted by some lesson in its module.
 */

const CONTENT_ROOT: string = dirname(CONTENT_DIR);

const EXERCISE_REF = /<Exercise\s+slug="([^"]+)"/g;

interface ModuleExercises {
  world: string;
  module: string;
  referenced: Map<string, string[]>; // slug -> lesson files referencing it
  authored: Set<string>; // slugs defined in exercises/*.yaml
}

function collectModules(): ModuleExercises[] {
  const modules: ModuleExercises[] = [];
  for (const world of readdirSync(CONTENT_ROOT)) {
    const worldDir = join(CONTENT_ROOT, world);
    if (!statSync(worldDir).isDirectory() || world === "blog") continue;
    for (const mod of readdirSync(worldDir)) {
      const modDir = join(worldDir, mod);
      if (!statSync(modDir).isDirectory()) continue;
      const entry: ModuleExercises = {
        world,
        module: mod,
        referenced: new Map(),
        authored: new Set(),
      };
      for (const file of readdirSync(modDir)) {
        if (!file.endsWith(".mdx")) continue;
        const text = readFileSync(join(modDir, file), "utf8");
        for (const m of text.matchAll(EXERCISE_REF)) {
          const slug = m[1];
          const refs = entry.referenced.get(slug) ?? [];
          refs.push(`${world}/${mod}/${file}`);
          entry.referenced.set(slug, refs);
        }
      }
      const exDir = join(modDir, "exercises");
      if (existsSync(exDir)) {
        for (const file of readdirSync(exDir)) {
          if (!file.endsWith(".yaml")) continue;
          const text = readFileSync(join(exDir, file), "utf8");
          const slug = /^slug:\s*(\S+)/m.exec(text)?.[1];
          if (slug) entry.authored.add(slug);
        }
      }
      modules.push(entry);
    }
  }
  return modules;
}

describe("exercise slug references", () => {
  const modules = collectModules();

  it("covers the full corpus (guard against a silently wrong root)", () => {
    expect(modules.length).toBeGreaterThan(50);
  });

  it("every <Exercise slug> resolves to an exercise in its module", () => {
    const broken: string[] = [];
    for (const m of modules) {
      for (const [slug, files] of m.referenced) {
        if (!m.authored.has(slug)) {
          broken.push(`${slug} (referenced by ${files.join(", ")})`);
        }
      }
    }
    expect(broken, broken.join("\n")).toEqual([]);
  });

  it("every authored exercise is mounted by a lesson in its module", () => {
    const orphaned: string[] = [];
    for (const m of modules) {
      for (const slug of m.authored) {
        if (!m.referenced.has(slug)) {
          orphaned.push(`${m.world}/${m.module}: ${slug}`);
        }
      }
    }
    expect(orphaned, orphaned.join("\n")).toEqual([]);
  });
});

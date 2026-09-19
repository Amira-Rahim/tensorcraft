import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  TRANSFER_CAPABILITIES,
  WORLD_LEARNING_SCOPE,
  WORLD_RELEASE,
  WORLD_SLUGS,
  isLaunched,
} from "@tensorcraft/shared";

const root = resolve(import.meta.dirname, "../../..");
describe("cross-world continuation contracts", () => {
  it("links to authored skills and modules without opening unreleased courses", () => {
    const lessons = JSON.parse(
      readFileSync(
        resolve(root, "packages/content/.velite/lessons.json"),
        "utf8",
      ),
    );
    for (const reference of Object.values(TRANSFER_CAPABILITIES)) {
      const [, , worldId, moduleId, slug] = reference.href
        .split("?")[0]
        .split("/");
      expect(
        lessons.some(
          (lesson: { worldId: string; moduleId: string; slug: string }) =>
            lesson.worldId === worldId &&
            lesson.moduleId === moduleId &&
            lesson.slug === slug,
        ),
        reference.href,
      ).toBe(true);
    }
    for (const world of WORLD_SLUGS) {
      expect(WORLD_RELEASE[world].courseAvailable).toBe(isLaunched(world));
      for (const module of WORLD_LEARNING_SCOPE[world].sourceModules)
        expect(
          existsSync(
            resolve(
              root,
              `packages/content/content/${world}/${module}/module.yaml`,
            ),
          ),
          `${world}/${module}`,
        ).toBe(true);
      for (const capability of WORLD_LEARNING_SCOPE[world].reuses)
        expect(TRANSFER_CAPABILITIES[capability]).toBeDefined();
    }
    expect(WORLD_RELEASE["neon-protocol"].status).toBe("preview");
    expect(WORLD_RELEASE["neon-protocol"].courseAvailable).toBe(false);
  });
  it("ends Deep Orbit on its operator record, without a commercial continuation", () => {
    const source = readFileSync(
      resolve(
        root,
        "packages/content/content/deep-orbit/capstone/05-launch.mdx",
      ),
      "utf8",
    );
    expect(source).not.toContain("<DispatchTease");
    expect(source.trim()).toMatch(/operator_note: none`\s*<\/Epilogue>$/);
    expect(
      source.indexOf("The transferable work is the engineering"),
    ).toBeLessThan(source.indexOf("<Epilogue>"));
  });
});

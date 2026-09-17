// Inventory, not an automated judgment of teaching quality. Build content first.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const compiled = (name) =>
  JSON.parse(read(`packages/content/.velite/${name}.json`));
const modules = compiled("modules")
  .filter((m) => m.worldId === "deep-orbit")
  .sort((a, b) => a.order - b.order);
const lessons = compiled("lessons").filter((l) => l.worldId === "deep-orbit");
const exercises = compiled("exercises");
const result = {
  version: 1,
  scope: "Deep Orbit learning inventory",
  interpretation:
    "Source inventory and declared progression. See deep-orbit-assessment-review.json for the dated manual assessment review and its source hashes. A linked exercise is not proof that every objective is assessed; learner readiness remains unvalidated.",
  modules: modules.map((module) => ({
    slug: module.slug,
    title: module.title,
    order: module.order,
    declaredPrerequisites: module.prerequisites,
    lessons: lessons
      .filter((l) => l.moduleId === module.slug)
      .sort((a, b) => a.order - b.order)
      .map((lesson) => {
        const dir = `packages/content/content/deep-orbit/${module.slug}`;
        const filename = readdirSync(path.join(root, dir)).find(
          (name) =>
            name.endsWith(".mdx") &&
            read(`${dir}/${name}`).match(/^slug:\s*(.+)$/m)?.[1] ===
              lesson.slug,
        );
        if (!filename) throw new Error(`Missing source for ${lesson.slug}`);
        const sourcePath = `${dir}/${filename}`,
          source = read(sourcePath);
        const objectiveMatch = source.match(
          /<LearningObjectives\s+objectives=\{(\[[\s\S]*?\])\}/,
        );
        if (!objectiveMatch)
          throw new Error(`No authored objectives in ${sourcePath}`);
        const refs = [...source.matchAll(/<Exercise\s+slug="([^"]+)"/g)].map(
          (m) => m[1],
        );
        return {
          slug: lesson.slug,
          title: lesson.title,
          sourcePath,
          sourceSha256: createHash("sha256").update(source).digest("hex"),
          objectives: JSON.parse(objectiveMatch[1]),
          explanationSections: [...source.matchAll(/^## (.+)$/gm)]
            .map((m) => m[1])
            .filter((title) => title !== "Challenge"),
          practice: refs.map((slug) => {
            const exercise = exercises.find(
              (e) => e.slug === slug && e.lessonSlug === lesson.slug,
            );
            if (!exercise) throw new Error(`Unmatched exercise ${slug}`);
            return {
              slug,
              title: exercise.title,
              sourcePath: `${dir}/exercises/${slug}.yaml`,
              taskOpening: exercise.instructions.split("\n\n")[0],
              feedback:
                "Executable assertions and lesson hints; assessment review covers grader logic and selectively reviews diagnostic wording, not a complete feedback copyedit",
              declaredDifficulty: exercise.difficulty,
            };
          }),
          recallQuestions: (lesson.recallPrompts ?? []).map((p) => p.question),
          decisionTasks: [
            ...source.matchAll(/<DecisionTask\s+id="([^"]+)"/g),
          ].map((m) => ({
            id: m[1],
            evidence:
              "Choice/calculation checks plus recorded rationale, help, reported time and attempt history; explanation review pending",
            sourcePath: "apps/web/app/components/mdx/decision-task-data.ts",
          })),
          independentProject: source.includes("<IndependentProject")
            ? {
                id: "room-occupancy-v1",
                briefPath:
                  "apps/web/public/assignments/room-occupancy-v1/README.md",
                rubricPath:
                  "apps/web/public/assignments/room-occupancy-v1/RUBRIC.md",
                evidence:
                  "Standalone artifact path verified with a maintainer fixture; learner work and independent review unobserved",
              }
            : null,
          transferAssignment: source.includes("<TransferAssignment")
            ? "build-triage-v1: separate self-review, assistance recorded, no automatic pass"
            : null,
          assessmentAlignment:
            "See deep-orbit-assessment-review.json for manual objective-level findings and open gaps; inventory regeneration does not renew that review",
        };
      }),
  })),
};
writeFileSync(
  path.join(root, "docs/audits/deep-orbit-learning-map.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Mapped ${result.modules.length} modules, ${lessons.length} lessons and ${result.modules.flatMap((m) => m.lessons).flatMap((l) => l.practice).length} exercise references.`,
);

import { defineCollection, defineConfig, s } from "velite";
import ts from "typescript";
import { rehypeGlossary } from "./src/rehype-glossary";
import { rehypePairCompanions } from "./src/rehype-pair-companions";
import { GLOSSARY } from "./src/glossary";
import {
  glossaryTermsInCompiledBody,
  findGlossaryTermsInText,
} from "./src/glossary-match";
import { collectLessonDocumentation } from "./src/lesson-documentation";
import { parseRecallPrompts } from "./src/parse-recall-prompts";
import { BUILT_WORLD_GLOB } from "./src/built-worlds";
import { taskBriefLines } from "./src/task-brief-lines";

/**
 * Transpile TS-flavored exercise code to plain JS so the runtime worker
 * (which uses `new Function(...)` and cannot parse TS syntax) can execute
 * solutions and tests authored in TypeScript. Also strips ES module
 * `import`/`export` statements which the worker bundles its own globals for.
 */
function tsToJs(src: string): string {
  if (!src) return src;
  // Strip imports first; the worker injects globals (tf, expect, describe, it).
  // Stripping pre-transpile prevents TS from emitting CJS namespace-import helpers
  // (__importStar, __createBinding, etc.) which would then call require() and fail.
  const noImports = src
    .replace(/^\s*import\s+.*\s+from\s+['"][^'"]+['"];?\s*$/gm, "")
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, "")
    .replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, "")
    // Drop `export ` prefix on declarations; keep the declaration itself.
    .replace(
      /^(\s*)export\s+(default\s+)?(?=(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\b)/gm,
      "$1",
    );
  const out = ts.transpileModule(noImports, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      removeComments: false,
      esModuleInterop: true,
      isolatedModules: false,
      noEmitOnError: false,
    },
  });
  // Strip any residual `export` keywords on declarations (isolatedModules emit may keep them as `Object.defineProperty`).
  return (
    out.outputText
      .replace(/^"use strict";\s*\n?/m, "")
      .replace(/^Object\.defineProperty\(exports,.*$/gm, "")
      .replace(/^exports\.\w+\s*=\s*(?:void 0|\w+);?\s*$/gm, "")
      // Strip CommonJS require() that TS emits for `import` statements; the worker
      // injects globals (tf, expect, describe, it) so any external import is wrong.
      .replace(
        /^(?:const|var|let)\s+[\w{}\s,*:]+\s*=\s*require\(['"][^'"]+['"]\);?\s*$/gm,
        "",
      )
      .replace(/^require\(['"][^'"]+['"]\);?\s*$/gm, "")
  );
}

// V1 launched world dirs; keep in sync with LAUNCHED_WORLDS in
// packages/shared/src/constants.ts. Coming-soon worlds' .mdx/.yaml stay in the
// repo (under packages/content/content/{slug}/) but are excluded from the build
// so their content does not ship in `.velite/*` outputs.
// Single source (packages/content/src/built-worlds.ts) shared with every QA
// gate: launch a world by adding it there once.
const LAUNCHED_WORLD_DIRS = BUILT_WORLD_GLOB;

const lessons = defineCollection({
  name: "Lesson",
  // Scoped to launched world dirs.
  pattern: `${LAUNCHED_WORLD_DIRS}/**/*.mdx`,
  schema: s
    .object({
      slug: s.slug("lessons"),
      title: s.string().min(1),
      moduleId: s.string().min(1),
      worldId: s.string().min(1),
      order: s.number().int().positive(),
      estimatedMinutes: s.number().int().positive(),
      difficulty: s.enum(["beginner", "intermediate", "advanced"]),

      // 5C Loop structured sections (Context, Concept, Consequence in frontmatter)
      context: s.object({
        narrative: s.string().min(1),
        speaker: s.string().optional(),
      }),
      concept: s.object({
        explanation: s.string().min(1),
        bridge: s
          .object({
            jsTitle: s.string(),
            jsCode: s.string(),
            mlTitle: s.string(),
            mlCode: s.string(),
            tier: s.enum(["identity", "structural", "intuition"]),
            breaks: s.string().optional(),
          })
          .optional(),
      }),
      // Code and Challenge sections live in the MDX body
      consequence: s.object({
        narrative: s.string().min(1),
      }),

      // Screenplay scene metadata (optional; falls back gracefully)
      scene: s
        .object({
          location: s.string(),
          time: s.string().optional(),
          epilogueLocation: s.string().optional(),
          // Alt text for the per-scene portrait art; absent means the
          // portrait renders decorative (alt="") until authored.
          portraitAlt: s.string().optional(),
          epiloguePortraitAlt: s.string().optional(),
        })
        .optional(),

      // Progressive hints. Default is the 3-level ladder (nudge/guidance/
      // solution); 2 hints are legal where the exercise is a single call and a
      // middle "guidance" tier would just restate the solution (style bible
      // rule 3: counts are not sacred).
      hints: s
        .array(
          s.object({
            level: s.enum(["nudge", "guidance", "solution"]),
            content: s.string().min(1),
          }),
        )
        .min(2)
        .max(3)
        .optional(),

      // Pedagogical pattern. The lesson BODY carries the alternate structure
      // (authored that way); this field tags it so the Briefing eyebrow
      // renders a FORMAT line (PATTERN_LABELS in lesson-steps.tsx) and the
      // variety gate can assert skeleton-breakers exist per module.
      // Absent frontmatter defaults to "standard".
      pattern: s
        .enum([
          "standard",
          "broken_code_first",
          "discovery",
          "flashback",
          "peer_review",
        ])
        .optional()
        .default("standard"),

      keywords: s.array(s.string()).default([]),

      // Skill Genome: which axes this lesson affects (optional, for event tracking)
      skillAxes: s
        .array(
          s.enum([
            "data_prep",
            "model_arch",
            "training",
            "evaluation",
            "deployment",
            "js_integration",
          ]),
        )
        .optional()
        .default([]),

      // Velite-specific: compiled MDX body and metadata
      body: s.mdx(),
      // The unmodified MDX source. Declared only so the transform below can
      // read the <RecallPrompt> tags out of it; it is destructured away
      // there so the whole source never reaches .velite/lessons.json.
      rawBody: s.raw(),
      metadata: s.metadata(),
    })
    .transform((data) => {
      const { rawBody, ...rest } = data;
      const glossaryTerms = glossaryTermsInCompiledBody(data.body, GLOSSARY);
      return {
        ...rest,
        // The Takeaways "Terms in this lesson" list shows exactly the terms
        // the rendered body underlines. Matching the MDX source instead listed
        // 242 terms across 56 lessons that no reader ever saw as a chip,
        // several off JSX attributes in the other sense of the word (gate:
        // __tests__/glossary-rail-contract.test.ts).
        glossaryTerms,
        documentation: collectLessonDocumentation(
          [
            ...glossaryTerms,
            ...findGlossaryTermsInText(data.keywords.join(" "), GLOSSARY),
          ],
          rawBody,
        ),
        // Prompt text lifted out of the RAW body, unlike glossaryTerms above,
        // which deliberately matches the compiled one. The raw source is
        // where the authored `question` and `answer` props still exist as
        // literal strings. Extracted so a surface can show a prompt from a
        // lesson other than the one being read (gate:
        // __tests__/recall-prompt-extraction.test.ts).
        recallPrompts: parseRecallPrompts(rawBody),
      };
    }),
});

const exercises = defineCollection({
  name: "Exercise",
  pattern: `${LAUNCHED_WORLD_DIRS}/**/exercises/*.yaml`,
  schema: s
    .object({
      slug: s.slug("exercises"),
      lessonSlug: s.string().min(1),
      title: s.string().min(1),
      instructions: s.string().min(1),
      taskBrief: s
        .object({
          title: s.string().min(1).optional(),
          intro: s.string().min(1).optional(),
          steps: s
            .array(
              s.object({
                title: s.string().min(1),
                instruction: s.string().min(1),
                code: s.string().min(1),
                result: s.string().optional(),
                // The variable this step fills. The transform below finds its
                // declaration in the built starter (spec 2026-10-10).
                target: s.string().regex(/^[A-Za-z_$][\w$]*$/),
                placeholder: s.string().min(1).optional(),
              }),
            )
            .min(1),
          support: s.string().min(1),
          expectedTensor: s
            .object({
              values: s.array(s.number()).min(1),
              shape: s.array(s.number().int().nonnegative()).min(1),
            })
            .optional(),
        })
        .optional(),
      starterCode: s.string().min(1).transform(tsToJs),
      solutionCode: s.string().min(1).transform(tsToJs),
      testCode: s.string().min(1).transform(tsToJs),
      estimatedMinutes: s.number().int().positive(),
      difficulty: s.enum(["beginner", "intermediate", "advanced"]),

      // A hint ladder of the exercise's own. The lesson's `hints` ladder serves
      // the lesson's primary exercise (the one whose solutionCode the solution
      // rung is excerpted from); an exercise that needs a ladder of its own
      // carries it here. Most are second exercises (the incident drills, the
      // capstone's rehearsal, rag-pipeline), but ci-cd-gate and
      // verify-deployment come first in their lessons and browser-ml-tradeoffs
      // is its lesson's only one. ExerciseBrief renders it beneath the
      // exercise's instructions in the Challenge step's reading column
      // (2026-09-25). Same shape and gates as the lesson ladder:
      // guidance-hint-dictation.test.ts and Gate B in
      // metadata-consistency.test.ts read this field when present (2026-09-13,
      // plan item 4).
      hints: s
        .array(
          s.object({
            level: s.enum(["nudge", "guidance", "solution"]),
            content: s.string().min(1),
          }),
        )
        .min(2)
        .max(3)
        .optional(),

      // ML-content axis (independent of cognitive difficulty). Distinguishes
      // exercises that exercise real ML primitives (model/training/...) from
      // those that are arithmetic-grade JavaScript wrapped in ML framing. See
      // docs/audits/exercise-mlcontent-audit-2026-04-26.md.
      mlContent: s
        .enum([
          "arithmetic",
          "data",
          "model",
          "training",
          "evaluation",
          "deployment",
          "systems",
        ])
        .optional()
        .default("arithmetic"),

      // Skill Genome: the primary axis a PASS on this exercise credits.
      // Read by the exercise component, which puts it on the submit result as
      // `skillAxis` so the caller can credit the axis the exercise declares.
      // Before 2026-09-08 nothing read this field: an `exercise_pass` credited
      // every axis in `lesson.skillAxes` instead, which double-credits a
      // two-axis lesson for one exercise and credits the wrong axis wherever
      // an exercise's axis is not one of its lesson's. Keep it optional: an
      // exercise without one falls back to the lesson's axis list.
      skillAxis: s
        .enum([
          "data_prep",
          "model_arch",
          "training",
          "evaluation",
          "deployment",
          "js_integration",
        ])
        .optional(),
    })
    // Each brief step's line in the BUILT starter, for the Line keys (spec
    // 2026-10-10, section 5 item 10). A bad target throws. velite 0.4's CLI
    // defaults --strict to false, and that overrides the config's
    // strict: true, so an issue added with ctx.addIssue would only be logged
    // and the build would ship an empty step list.
    .transform((data) => {
      const { taskBrief, ...rest } = data;
      if (!taskBrief) return { ...rest, taskBrief: undefined };
      const lines = taskBriefLines(data.starterCode, taskBrief.steps);
      if (!lines.ok) {
        throw new Error(`${data.slug}: ${lines.errors.join(" ")}`);
      }
      return { ...rest, taskBrief: { ...taskBrief, steps: lines.steps } };
    }),
});

const modules = defineCollection({
  name: "Module",
  pattern: `${LAUNCHED_WORLD_DIRS}/**/module.yaml`,
  schema: s.object({
    slug: s.slug("modules"),
    title: s.string().min(1),
    worldId: s.string().min(1),
    order: s.number().int().positive(),
    description: s.string().min(1),
    // Plain-language one-liner for surfaces a reader sees BEFORE lesson 1
    // (the module map and the /pricing curriculum preview), where
    // `description`'s story framing assumes context they do not have yet
    // (owner bar 2026-08-16; pre-lesson copy audit 2026-08-19). Required
    // so a new module cannot ship without one.
    summary: s.string().min(1),
    lessonCount: s.number().int().positive(),
    prerequisites: s.array(s.string()).default([]),
    // "foundations" = shared core (modules 1-6), "specialization" = world-specific (modules 7-11)
    // "companion" = optional deep-dive companion modules, "bonus" = unlockable bonus content
    track: s
      .enum(["foundations", "specialization", "companion", "bonus"])
      .default("foundations"),
    unlockCondition: s.string().optional(),
  }),
});

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s.object({
    slug: s.slug("posts"),
    title: s.string().min(1),
    publishedAt: s.isodate(),
    weekIso: s.string().optional(),
    sourceUrl: s.string().url().optional(),
    sourceLabel: s.string().optional(),
    primaryLessonSlug: s.string().optional(),
    worldSlug: s
      .enum([
        "deep-orbit",
        "neon-protocol",
        "signal-ward",
        "nova-canvas",
        "terra-grid",
      ])
      .optional(),
    summary: s.string().min(1),
    matchedLessons: s
      .array(
        s.object({
          worldId: s.string(),
          moduleId: s.string(),
          slug: s.string(),
          title: s.string(),
          rationale: s.string().optional(),
        }),
      )
      .default([]),
    tags: s.array(s.string()).default([]),
    body: s.mdx(),
    metadata: s.metadata(),
  }),
});

export default defineConfig({
  root: "content",
  strict: true,
  output: {
    data: ".velite",
    clean: true,
  },
  mdx: {
    // Velite's comment remover also deletes code strings containing /* */.
    // MDX already omits real comment expressions from rendered output.
    removeComments: false,
    rehypePlugins: [
      [rehypeGlossary, { dictionary: GLOSSARY }],
      // Order is immaterial today: rehype-glossary never enters JSX, so
      // moving a companion cannot change which occurrence is underlined first.
      rehypePairCompanions,
    ],
  },
  collections: { lessons, exercises, modules, posts },
});

import { defineCollection, defineConfig, s } from "velite";
import ts from "typescript";
import { rehypeGlossary } from "./src/rehype-glossary";
import { GLOSSARY } from "./src/glossary";
import { findGlossaryTermsInText } from "./src/glossary-match";
import { BUILT_THEME_GLOB } from "./src/built-themes";

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

// V1 launched theme dirs; keep in sync with LAUNCHED_THEMES in
// packages/shared/src/constants.ts. Coming-soon themes' .mdx/.yaml stay in the
// repo (under packages/content/content/{slug}/) but are excluded from the build
// so their content does not ship in `.velite/*` outputs.
// Single source (packages/content/src/built-themes.ts) shared with every QA
// gate: launch a theme by adding it there once.
const LAUNCHED_THEME_DIRS = BUILT_THEME_GLOB;

const lessons = defineCollection({
  name: "Lesson",
  // Scoped to launched theme dirs (extras included for shared cross-theme content).
  pattern: `${LAUNCHED_THEME_DIRS}/**/*.mdx`,
  schema: s
    .object({
      slug: s.slug("lessons"),
      title: s.string().min(1),
      moduleId: s.string().min(1),
      themeId: s.string().min(1),
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
            feTitle: s.string(),
            feCode: s.string(),
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
      // (authored that way); this field tags it so the Briefing SceneCard
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
            "fe_integration",
          ]),
        )
        .optional()
        .default([]),

      // Velite-specific: compiled MDX body and metadata
      body: s.mdx(),
      metadata: s.metadata(),
    })
    .transform((data, { meta }) => {
      const raw = typeof meta.content === "string" ? meta.content : "";
      const prose = raw
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ");
      return {
        ...data,
        glossaryTerms: findGlossaryTermsInText(prose, GLOSSARY),
      };
    }),
});

const exercises = defineCollection({
  name: "Exercise",
  pattern: `${LAUNCHED_THEME_DIRS}/**/exercises/*.yaml`,
  schema: s.object({
    slug: s.slug("exercises"),
    lessonSlug: s.string().min(1),
    title: s.string().min(1),
    instructions: s.string().min(1),
    starterCode: s.string().min(1).transform(tsToJs),
    solutionCode: s.string().min(1).transform(tsToJs),
    testCode: s.string().min(1).transform(tsToJs),
    estimatedMinutes: s.number().int().positive(),
    difficulty: s.enum(["beginner", "intermediate", "advanced"]),

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

    // Skill Genome: primary axis this exercise affects (optional, for event tracking)
    skillAxis: s
      .enum([
        "data_prep",
        "model_arch",
        "training",
        "evaluation",
        "deployment",
        "fe_integration",
      ])
      .optional(),
  }),
});

const modules = defineCollection({
  name: "Module",
  pattern: `${LAUNCHED_THEME_DIRS}/**/module.yaml`,
  schema: s.object({
    slug: s.slug("modules"),
    title: s.string().min(1),
    themeId: s.string().min(1),
    order: s.number().int().positive(),
    description: s.string().min(1),
    lessonCount: s.number().int().positive(),
    prerequisites: s.array(s.string()).default([]),
    // "foundations" = shared core (modules 1-6), "specialization" = theme-specific (modules 7-11)
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
    themeSlug: s
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
          themeId: s.string(),
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
  mdx: { rehypePlugins: [[rehypeGlossary, { dictionary: GLOSSARY }]] },
  collections: { lessons, exercises, modules, posts },
});

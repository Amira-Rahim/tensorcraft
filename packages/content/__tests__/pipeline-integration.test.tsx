/**
 * §8j Content pipeline integration test.
 *
 * APPROACH
 * ────────
 * Full content pipeline coverage without invoking Velite at runtime:
 *
 *   1. Start with a representative "post-parse" frontmatter object,
 *      the shape Velite's YAML parser would hand off to the Zod layer.
 *      (We don't re-run YAML parsing here; the Velite build does that
 *      and its own contract test covers the YAML→JS step.)
 *   2. Validate the frontmatter against the exported Zod schema and
 *      assert rejection for known-malformed variants (missing title,
 *      invalid enum, wrong hint count).
 *   3. Render each of the custom MDX components that a lesson body
 *      uses, Dialogue, BridgeCallout, CodeBlock, Exercise, HintPanel,
 *      Quiz, SceneHeading, and assert the expected DOM shape.
 *   4. Hand Zod-validated frontmatter slices directly into the
 *      components to prove end-to-end prop compatibility.
 *
 * Live-service caveat: this does NOT run `velite build`. The existing
 * `packages/content/src/contract.test.ts` suite covers the Velite→Zod
 * schema drift concern using sample fixtures.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { lessonSchema } from "../src/schemas";
import type { ExerciseData } from "../../ui/src/mdx/exercise";

// Shiki loads many grammars, mock so CodeBlock falls back to <pre><code>.
vi.mock("shiki", () => ({
  createHighlighter: () => Promise.reject(new Error("mocked, fallback")),
}));

// Import components directly by module path, sidestep the
// `@tensorcraft/ui` barrel so we never touch the Exercise component
// (which pulls in Sandpack's CSS-in-JS stack and blows up in jsdom).
// The Exercise component is covered by its own suite
// `packages/ui/src/mdx/exercise.test.ts`; we don't re-verify it here.
// Its data provider lives in exercise-data.tsx, which imports no Sandpack
// (spec 2026-09-24, section 3), so it loads here.
const { BridgeCallout } = await import("../../ui/src/mdx/bridge-callout");
const { Dialogue } = await import("../../ui/src/mdx/dialogue");
const { HintPanel } = await import("../../ui/src/mdx/hint-panel");
const { Quiz } = await import("../../ui/src/mdx/quiz");
const { SceneHeading } = await import("../../ui/src/mdx/scene-heading");
const { CodeBlock } = await import("../../ui/src/mdx/code-block");
const { ExerciseDataContext, ExerciseDataProvider } =
  await import("../../ui/src/mdx/exercise-data");

// ─────────────────────────────────────────────────────────────
// Canonical frontmatter object, mirrors what Velite hands over
// to the MDX renderer after parsing `01-introduction-to-tensors.mdx`.
// ─────────────────────────────────────────────────────────────

const SAMPLE_FRONTMATTER = {
  slug: "introduction-to-tensors",
  title: "Introduction to Tensors",
  moduleId: "foundations",
  worldId: "deep-orbit",
  order: 1,
  estimatedMinutes: 25,
  difficulty: "beginner" as const,
  context: {
    narrative:
      "The Archimedes receives a mysterious data stream from deep space.",
    speaker: "Commander Mirza",
  },
  concept: {
    explanation: "Tensors are multi-dimensional arrays.",
    bridge: {
      jsTitle: "Float32Array",
      jsCode: "const arr = new Float32Array([1,2,3])",
      mlTitle: "Tensor",
      mlCode: "const t = tf.tensor([1,2,3])",
      tier: "identity" as const,
    },
  },
  consequence: {
    narrative: "The signal begins to take shape.",
  },
  hints: [
    { level: "nudge" as const, content: "Arrays store data in memory" },
    {
      level: "guidance" as const,
      content: "Use tf.tensor() to create tensors",
    },
    { level: "solution" as const, content: "const t = tf.tensor([1,2,3])" },
  ],
  keywords: ["tensor", "array"],
};

describe("Content pipeline: frontmatter → Zod → components", () => {
  describe("Stage 1: Zod schema validation", () => {
    it("accepts a valid lesson frontmatter", () => {
      const result = lessonSchema.safeParse(SAMPLE_FRONTMATTER);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.worldId).toBe("deep-orbit");
        expect(result.data.concept.bridge?.tier).toBe("identity");
        expect(result.data.hints).toHaveLength(3);
      }
    });

    it("rejects malformed frontmatter (missing required title)", () => {
      const { title: _drop, ...incomplete } = SAMPLE_FRONTMATTER;
      const result = lessonSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it("rejects malformed frontmatter (invalid difficulty enum)", () => {
      const result = lessonSchema.safeParse({
        ...SAMPLE_FRONTMATTER,
        difficulty: "expert",
      });
      expect(result.success).toBe(false);
    });

    it("rejects malformed frontmatter (invalid bridge tier)", () => {
      const result = lessonSchema.safeParse({
        ...SAMPLE_FRONTMATTER,
        concept: {
          ...SAMPLE_FRONTMATTER.concept,
          bridge: { ...SAMPLE_FRONTMATTER.concept.bridge, tier: "not-a-tier" },
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects malformed frontmatter (fewer than 3 hints)", () => {
      const result = lessonSchema.safeParse({
        ...SAMPLE_FRONTMATTER,
        hints: [{ level: "nudge", content: "only one" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects malformed frontmatter (empty context.narrative)", () => {
      const result = lessonSchema.safeParse({
        ...SAMPLE_FRONTMATTER,
        context: { ...SAMPLE_FRONTMATTER.context, narrative: "" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts frontmatter without a bridge (optional)", () => {
      const result = lessonSchema.safeParse({
        ...SAMPLE_FRONTMATTER,
        concept: { explanation: "no bridge here" },
      });
      expect(result.success).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Stage 2: render each custom MDX component used inside lesson bodies.
  // These are the exact components available in the MDX runtime.
  // ─────────────────────────────────────────────────────────────

  describe("Stage 2: custom MDX components render correctly", () => {
    it("Dialogue: shows speaker + body text", () => {
      render(
        <Dialogue speaker="Commander Mirza">
          We need to think in data structures.
        </Dialogue>,
      );
      expect(screen.getByText("Commander Mirza")).toBeInTheDocument();
      expect(
        screen.getByText(/we need to think in data structures/i),
      ).toBeInTheDocument();
    });

    it("SceneHeading: renders location + time uppercased", () => {
      render(<SceneHeading location="Bridge" time="Day 47" />);
      expect(screen.getByText(/bridge/i)).toBeInTheDocument();
      expect(screen.getByText(/day 47/i)).toBeInTheDocument();
    });

    it("BridgeCallout: renders both JS + ML sides for an identity tier", () => {
      render(
        <BridgeCallout
          bridge={{
            jsTitle: "Float32Array",
            jsCode: "new Float32Array([1,2,3])",
            mlTitle: "Tensor",
            mlCode: "tf.tensor([1,2,3])",
            tier: "identity",
          }}
        />,
      );
      expect(screen.getByText("Float32Array")).toBeInTheDocument();
      expect(screen.getByText("Tensor")).toBeInTheDocument();
      expect(screen.getByText(/new Float32Array/)).toBeInTheDocument();
      expect(screen.getByText(/tf\.tensor/)).toBeInTheDocument();
    });

    it("CodeBlock: renders fallback <pre><code> with language badge + title", () => {
      const { container } = render(
        <CodeBlock language="typescript" title="hello.ts">
          const hello = "world";
        </CodeBlock>,
      );
      expect(screen.getByText("hello.ts")).toBeInTheDocument();
      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
      const pre = container.querySelector("pre");
      expect(pre).not.toBeNull();
    });

    it("HintPanel: progressively reveals 3 hints", () => {
      const hints = [
        { level: "nudge" as const, content: "Think in arrays" },
        { level: "guidance" as const, content: "Use tf.tensor()" },
        { level: "solution" as const, content: "const t = tf.tensor([1])" },
      ];
      render(<HintPanel hints={hints} />);

      // Initially only the nudge is revealable.
      expect(screen.getByText(/Reveal Nudge/i)).toBeInTheDocument();
      expect(screen.queryByText(/think in arrays/i)).not.toBeInTheDocument();

      // Reveal them in order.
      fireEvent.click(screen.getByText(/Reveal Nudge/i));
      expect(screen.getByText(/think in arrays/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Reveal Guidance/i));
      expect(screen.getByText(/use tf\.tensor/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Reveal Solution/i));
      expect(screen.getByText(/const t = tf\.tensor/i)).toBeInTheDocument();
    });

    it("Quiz: grades correct answer", () => {
      render(
        <Quiz
          question="What is a tensor?"
          options={[
            { text: "A GPU model", correct: false },
            { text: "A multi-dimensional array", correct: true },
            { text: "A React hook", correct: false },
          ]}
        />,
      );
      expect(screen.getByText("What is a tensor?")).toBeInTheDocument();

      fireEvent.click(screen.getByText("A multi-dimensional array"));
      fireEvent.click(screen.getByText(/check answer/i));
      expect(screen.getByText(/correct!/i)).toBeInTheDocument();
    });

    it("Exercise: the package exports Exercise and a working ExerciseDataProvider", () => {
      // Exercise pulls Sandpack's CSS-in-JS stack at import time, which does
      // not initialize cleanly in jsdom, so its module is checked as text;
      // full behaviour is covered by `packages/ui/src/mdx/exercise.test.ts`.
      const read = (file: string) =>
        readFileSync(resolve(__dirname, "../../ui/src", file), "utf-8");
      expect(read("mdx/exercise.tsx")).toMatch(
        /export\s+function\s+Exercise\b/,
      );

      // Both barrels the pipeline imports through must name both
      // components: `export { A, B } from "./x"`, mapped name to source.
      const reExports = (src: string) => {
        const names = new Map<string, string>();
        for (const [, list, from] of src.matchAll(
          /export\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g,
        )) {
          for (const name of list.split(",")) {
            if (name.trim()) names.set(name.trim(), from);
          }
        }
        return names;
      };
      const mdx = reExports(read("mdx/index.ts"));
      expect(mdx.get("Exercise")).toBe("./exercise");
      expect(mdx.get("ExerciseDataProvider")).toMatch(/^\.\/exercise(-data)?$/);
      const pkg = reExports(read("index.ts"));
      expect(pkg.get("Exercise")).toBe("./mdx");
      expect(pkg.get("ExerciseDataProvider")).toBe("./mdx");

      // The provider hands its map to the context the pane and the brief
      // read. Only the map's size matters here, so the entry is a stub.
      render(
        <ExerciseDataProvider
          exercises={new Map([["stub", {} as ExerciseData]])}
        >
          <ExerciseDataContext.Consumer>
            {(exercises) => <p>{exercises.size} exercise</p>}
          </ExerciseDataContext.Consumer>
        </ExerciseDataProvider>,
      );
      expect(screen.getByText("1 exercise")).toBeInTheDocument();
    });
  });

  describe("Stage 3: Zod-validated frontmatter drives components end-to-end", () => {
    it("frontmatter.concept.bridge feeds directly into BridgeCallout", () => {
      const result = lessonSchema.safeParse(SAMPLE_FRONTMATTER);
      if (!result.success) throw new Error("schema failure");
      const bridge = result.data.concept.bridge;
      expect(bridge).toBeDefined();

      render(<BridgeCallout bridge={bridge} />);
      expect(screen.getByText("Float32Array")).toBeInTheDocument();
      expect(screen.getByText("Tensor")).toBeInTheDocument();
    });

    it("frontmatter.hints feeds directly into HintPanel", () => {
      const result = lessonSchema.safeParse(SAMPLE_FRONTMATTER);
      if (!result.success) throw new Error("schema failure");

      render(<HintPanel hints={result.data.hints} />);
      expect(screen.getByText(/Reveal Nudge/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/Reveal Nudge/i));
      expect(screen.getByText(/arrays store data/i)).toBeInTheDocument();
    });
  });
});

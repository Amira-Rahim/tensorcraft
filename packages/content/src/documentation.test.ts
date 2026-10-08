import { describe, expect, it } from "vitest";
import { GLOSSARY } from "./glossary";
import {
  CONCEPT_DOCUMENTATION,
  findTensorFlowReferences,
  tfjsApiReference,
} from "./documentation";
import { collectLessonDocumentation } from "./lesson-documentation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LessonReference } from "./lesson-documentation";

describe("lesson documentation", () => {
  it("gives every glossary concept a specific reference", () => {
    for (const term of GLOSSARY) {
      expect(term.documentation, term.term).toBeDefined();
      expect(term.documentation).toEqual(CONCEPT_DOCUMENTATION[term.term]);
      const url = new URL(term.documentation!.href);
      expect(url.protocol).toBe("https:");
      expect(term.documentation!.title.length).toBeGreaterThan(0);
      if (url.hostname === "js.tensorflow.org") {
        expect(url.hash).not.toBe("");
        expect(tfjsApiReference(url.hash.slice(1))?.href).toBe(url.href);
      }
    }
  });

  it("resolves real namespace, class and method anchors without inventing APIs", () => {
    expect(tfjsApiReference("tf.tensor")?.href).toContain("#tensor");
    expect(tfjsApiReference("tf.layers.dense")?.href).toContain(
      "#layers.dense",
    );
    expect(tfjsApiReference("tf.Tensor")?.href).toContain("#class:Tensor");
    expect(tfjsApiReference("tf.Tensor.arraySync")?.href).toContain(
      "#tf.Tensor.arraySync",
    );
    expect(tfjsApiReference("tf.math.confusionMatrix")?.href).toContain(
      "#confusionMatrix",
    );
    expect(tfjsApiReference("tf.layers.transformer")).toBeNull();
    expect(tfjsApiReference("tf.meaning")).toBeNull();
  });

  it("finds the APIs in an example once, including tensor reads and training options", () => {
    const references = findTensorFlowReferences(
      "tf.tensor([1]); tf.tensor([2]); reading.arraySync(); model.fit(xs, ys); values.map(f); tf.missing()",
    );
    expect(references.map((reference) => reference.title)).toEqual([
      "tf.tensor",
      "tf.Tensor.arraySync",
      "tf.LayersModel.fit",
    ]);
  });

  it("keeps broader concepts honestly labeled instead of creating fictional TFJS APIs", () => {
    for (const term of ["opset", "SVD", "kalman-filter", "rag"]) {
      expect(CONCEPT_DOCUMENTATION[term]?.kind).toBe("background");
      expect(CONCEPT_DOCUMENTATION[term]?.source).not.toBe("TensorFlow.js");
    }
    expect(CONCEPT_DOCUMENTATION["standard deviation"]?.kind).toBe(
      "related-api",
    );
  });

  it("groups a shared destination while retaining every concept name", () => {
    const terms = GLOSSARY.filter(({ term }) =>
      ["rank", "shape"].includes(term),
    );
    const references = collectLessonDocumentation(
      [...terms, ...terms],
      "tf.tensor([1])",
    );
    expect(references).toHaveLength(2);
    expect(references[0]?.concepts).toEqual(["rank", "shape"]);
  });

  it("ships references and term links for every built lesson", () => {
    const lessons: Array<{
      slug: string;
      glossaryTerms: typeof GLOSSARY;
      documentation: LessonReference[];
    }> = JSON.parse(
      readFileSync(join(__dirname, "../.velite/lessons.json"), "utf8"),
    );
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      expect(lesson.documentation.length, lesson.slug).toBeGreaterThan(0);
      expect(
        lesson.documentation.some((ref) => ref.source === "TensorFlow.js"),
        lesson.slug,
      ).toBe(true);
      expect(new Set(lesson.documentation.map((ref) => ref.href)).size).toBe(
        lesson.documentation.length,
      );
      for (const term of lesson.glossaryTerms) {
        expect(
          term.documentation,
          `${lesson.slug}: ${term.term}`,
        ).toBeDefined();
        expect(
          lesson.documentation.some(
            (ref) =>
              ref.href === term.documentation?.href &&
              ref.concepts.includes(term.term),
          ),
        ).toBe(true);
      }
    }
  });
});

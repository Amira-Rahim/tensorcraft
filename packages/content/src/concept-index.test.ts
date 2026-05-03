import { describe, it, expect } from "vitest";
import {
  normalizeConcept,
  tokenize,
  extractLessonConcepts,
  buildConceptIndex,
  findLessonsByConcepts,
} from "./concept-index";
import type { Lesson } from "./schemas";

const baseLesson = {
  estimatedMinutes: 25,
  difficulty: "beginner" as const,
  context: { narrative: "n" },
  consequence: { narrative: "n" },
  pattern: "standard" as const,
};

const lessonA: Lesson = {
  ...baseLesson,
  slug: "intro-tensors",
  title: "Introduction to Tensors",
  moduleId: "foundations",
  themeId: "deep-orbit",
  order: 1,
  concept: {
    explanation: "x",
    bridge: {
      feTitle: "TypedArray",
      feCode: "new Float32Array([1])",
      mlTitle: "Tensor",
      mlCode: "tf.tensor([1])",
      tier: "structural",
    },
  },
  keywords: ["tensor", "WebGPU", "tf.tensor"],
  skillAxes: ["data_prep"],
};

const lessonB: Lesson = {
  ...baseLesson,
  slug: "webgpu-acceleration",
  title: "WebGPU Acceleration",
  moduleId: "browser-runtimes",
  themeId: "neon-protocol",
  order: 4,
  concept: { explanation: "x" },
  keywords: ["web-gpu", "GPU", "inference"],
  skillAxes: ["deployment", "fe_integration"],
};

describe("normalizeConcept", () => {
  it("lowercases and collapses whitespace + hyphens", () => {
    expect(normalizeConcept("WebGPU")).toEqual(["webgpu"]);
    expect(normalizeConcept("Web GPU")).toEqual(["webgpu"]);
    expect(normalizeConcept("web-gpu")).toEqual(["webgpu"]);
    expect(normalizeConcept("on_device")).toEqual(["ondevice"]);
  });

  it("emits dot-segments alongside collapsed form", () => {
    const result = normalizeConcept("tf.tensor");
    expect(result).toContain("tftensor");
    expect(result).toContain("tf");
    expect(result).toContain("tensor");
  });

  it("filters empty strings and stopwords", () => {
    expect(normalizeConcept("")).toEqual([]);
    expect(normalizeConcept("   ")).toEqual([]);
    expect(normalizeConcept("the")).toEqual([]);
  });

  it("dedupes when canonical form equals dot-segment", () => {
    const result = normalizeConcept("tensor");
    expect(result).toEqual(["tensor"]);
  });
});

describe("tokenize", () => {
  it("splits on whitespace and punctuation", () => {
    expect(tokenize("Float32Array (typed array)")).toEqual([
      "Float32Array",
      "typed",
      "array",
    ]);
  });

  it("filters stopwords", () => {
    expect(tokenize("the tensor is a structure")).toEqual([
      "tensor",
      "structure",
    ]);
  });
});

describe("extractLessonConcepts", () => {
  it("pulls from keywords, bridge titles, skillAxes, and moduleId", () => {
    const concepts = extractLessonConcepts(lessonA);
    const sources = new Set(concepts.map((c) => c.source));
    expect(sources.has("keyword")).toBe(true);
    expect(sources.has("bridge_ml")).toBe(true);
    expect(sources.has("bridge_fe")).toBe(true);
    expect(sources.has("skill_axis")).toBe(true);
    expect(sources.has("module_id")).toBe(true);
  });

  it("normalizes hyphenated keywords to canonical form", () => {
    const concepts = extractLessonConcepts(lessonB);
    const tokens = concepts.map((c) => c.concept);
    expect(tokens).toContain("webgpu");
  });

  it("handles missing bridge gracefully", () => {
    expect(() => extractLessonConcepts(lessonB)).not.toThrow();
  });
});

describe("buildConceptIndex", () => {
  it("creates a reverse map from concept token to lessons", () => {
    const index = buildConceptIndex([lessonA, lessonB]);
    expect(index.totalLessons).toBe(2);
    expect(index.byConcept.webgpu).toBeDefined();
    expect(index.byConcept.webgpu.length).toBeGreaterThanOrEqual(2);
  });

  it("populates byLesson with sorted concept list per slug", () => {
    const index = buildConceptIndex([lessonA]);
    expect(index.byLesson["intro-tensors"]).toBeDefined();
    const sorted = [...index.byLesson["intro-tensors"]].sort();
    expect(index.byLesson["intro-tensors"]).toEqual(sorted);
  });

  it("includes builtAt ISO timestamp", () => {
    const index = buildConceptIndex([lessonA]);
    expect(() => new Date(index.builtAt).toISOString()).not.toThrow();
  });
});

describe("findLessonsByConcepts", () => {
  const index = buildConceptIndex([lessonA, lessonB]);

  it("returns lessons matching a concept token", () => {
    const results = findLessonsByConcepts(index, ["webgpu"]);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.lesson.slug === "webgpu-acceleration")).toBe(
      true,
    );
  });

  it("ranks higher-source lessons above lower-source lessons", () => {
    // Both A and B have a concept matching "webgpu", but A only via keyword,
    // B via keyword + module_id ("browser-runtimes" doesn't normalize to webgpu,
    // but keyword weight is the highest tier). A's keyword weight = 4, B's = 4.
    // Add a tie-breaker case: pure skill_axis (weight 1) vs keyword (weight 4).
    const results = findLessonsByConcepts(index, ["data_prep", "tensor"]);
    expect(results[0].lesson.slug).toBe("intro-tensors");
  });

  it("respects limit option", () => {
    const results = findLessonsByConcepts(index, ["webgpu"], { limit: 1 });
    expect(results.length).toBe(1);
  });

  it("returns empty when no concepts match", () => {
    expect(findLessonsByConcepts(index, ["nonexistent-concept-xyz"])).toEqual(
      [],
    );
  });

  it("dedupes lessons that match via multiple sources", () => {
    const results = findLessonsByConcepts(index, ["tensor"]);
    const slugs = results.map((r) => r.lesson.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

import type { Lesson } from "./schemas";

export interface LessonRef {
  worldId: string;
  moduleId: string;
  slug: string;
  title: string;
  /** Source field this concept came from; used for weighting downstream. */
  source: ConceptSource;
}

export type ConceptSource =
  | "keyword"
  | "bridge_ml"
  | "bridge_fe"
  | "skill_axis"
  | "module_id";

export interface ConceptIndex {
  /** Concept token → list of lessons mentioning it (with source). */
  byConcept: Record<string, LessonRef[]>;
  /** Reverse map: lesson slug → all concepts it surfaces. Useful for debugging. */
  byLesson: Record<string, string[]>;
  /** Build metadata. */
  builtAt: string;
  totalLessons: number;
  totalConcepts: number;
}

/**
 * Normalize a raw string into a concept token.
 *
 * USER CONTRIBUTION POINT: see request below.
 *
 * Examples of decisions this function encodes:
 *   - "WebGPU"     → "webgpu"      (lowercase)
 *   - "Web GPU"    → "webgpu"      (collapse whitespace + hyphens?)
 *   - "tf.tensor"  → ???           (split on `.`? keep as one token?)
 *   - "Float32Array" → "float32array" or "float32-array" or two tokens?
 *   - "On-Device"  → "on-device" or "ondevice" or "on device"?
 *   - "Tensor"     → "tensor"      (singularize? keep plural? both?)
 */
export function normalizeConcept(raw: string): string[] {
  const cleaned = raw.toLowerCase().trim();
  if (!cleaned || STOPWORDS.has(cleaned)) return [];

  // Canonical form: collapse whitespace, hyphens, underscores, and dots.
  const canonical = cleaned.replace(/[\s\-_.]+/g, "");

  // Emit dot-separated segments so "tf.tensor" surfaces as both the
  // collapsed form and its parts.
  const dotParts = cleaned
    .split(".")
    .map((p) => p.replace(/[\s\-_]+/g, ""))
    .filter((p) => p.length > 1 && !STOPWORDS.has(p));

  return [...new Set([canonical, ...dotParts])];
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "in",
  "to",
  "for",
  "with",
  "is",
  "are",
  "this",
  "that",
  "it",
]);

/** Split a free-text title or label into candidate tokens before normalization. */
export function tokenize(input: string): string[] {
  return input
    .split(/[\s,/()[\]{}<>"'`]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOPWORDS.has(t.toLowerCase()));
}

/**
 * Extract every (concept, source) pair surfaced by a single lesson.
 * Deterministic; pure function of the lesson record.
 */
export function extractLessonConcepts(
  lesson: Lesson,
): Array<{ concept: string; source: ConceptSource }> {
  const out: Array<{ concept: string; source: ConceptSource }> = [];

  const push = (raw: string, source: ConceptSource) => {
    for (const tok of normalizeConcept(raw)) {
      if (tok) out.push({ concept: tok, source });
    }
  };

  for (const kw of lesson.keywords ?? []) push(kw, "keyword");

  const bridge = lesson.concept?.bridge;
  if (bridge) {
    for (const tok of tokenize(bridge.mlTitle)) push(tok, "bridge_ml");
    for (const tok of tokenize(bridge.feTitle)) push(tok, "bridge_fe");
  }

  for (const axis of lesson.skillAxes ?? []) push(axis, "skill_axis");

  push(lesson.moduleId, "module_id");

  return out;
}

/** Build the full reverse index from every lesson in the corpus. */
export function buildConceptIndex(lessons: Lesson[]): ConceptIndex {
  const byConcept: Record<string, LessonRef[]> = {};
  const byLesson: Record<string, Set<string>> = {};

  for (const lesson of lessons) {
    const ref: Omit<LessonRef, "source"> = {
      worldId: lesson.worldId,
      moduleId: lesson.moduleId,
      slug: lesson.slug,
      title: lesson.title,
    };
    const seenForLesson = (byLesson[lesson.slug] ??= new Set());

    for (const { concept, source } of extractLessonConcepts(lesson)) {
      (byConcept[concept] ??= []).push({ ...ref, source });
      seenForLesson.add(concept);
    }
  }

  const byLessonOut: Record<string, string[]> = {};
  for (const [slug, set] of Object.entries(byLesson)) {
    byLessonOut[slug] = [...set].sort();
  }

  return {
    byConcept,
    byLesson: byLessonOut,
    builtAt: new Date().toISOString(),
    totalLessons: lessons.length,
    totalConcepts: Object.keys(byConcept).length,
  };
}

/**
 * Look up lessons matching one or more concept tokens.
 * Caller passes already-normalized tokens (use `normalizeConcept`).
 * Returns lessons ranked by match count, then by source weight.
 */
export function findLessonsByConcepts(
  index: ConceptIndex,
  concepts: string[],
  options: { limit?: number } = {},
): Array<{
  lesson: Omit<LessonRef, "source">;
  score: number;
  matched: string[];
}> {
  const { limit = 10 } = options;
  const sourceWeight: Record<ConceptSource, number> = {
    keyword: 4,
    bridge_ml: 3,
    bridge_fe: 2,
    module_id: 2,
    skill_axis: 1,
  };

  const accum: Record<
    string,
    { lesson: Omit<LessonRef, "source">; score: number; matched: Set<string> }
  > = {};

  for (const concept of concepts) {
    const refs = index.byConcept[concept];
    if (!refs) continue;
    for (const ref of refs) {
      const key = `${ref.worldId}/${ref.moduleId}/${ref.slug}`;
      const slot =
        accum[key] ??
        (accum[key] = {
          lesson: {
            worldId: ref.worldId,
            moduleId: ref.moduleId,
            slug: ref.slug,
            title: ref.title,
          },
          score: 0,
          matched: new Set(),
        });
      slot.score += sourceWeight[ref.source];
      slot.matched.add(concept);
    }
  }

  return Object.values(accum)
    .map((s) => ({
      lesson: s.lesson,
      score: s.score,
      matched: [...s.matched].sort(),
    }))
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)
    .slice(0, limit);
}

import type { GlossaryEntry } from "./glossary";
import {
  findTensorFlowReferences,
  type DocumentationReference,
} from "./documentation";

export interface LessonReference extends DocumentationReference {
  concepts: string[];
}

/** Group concepts sharing a destination without losing the concept names. */
export function collectLessonDocumentation(
  terms: GlossaryEntry[],
  source: string,
): LessonReference[] {
  const grouped = new Map<string, LessonReference>();
  for (const { term, documentation } of terms) {
    if (!documentation) continue;
    const existing = grouped.get(documentation.href);
    if (existing) {
      if (!existing.concepts.includes(term)) existing.concepts.push(term);
    } else {
      grouped.set(documentation.href, { ...documentation, concepts: [term] });
    }
  }
  for (const reference of findTensorFlowReferences(source)) {
    if (!grouped.has(reference.href)) {
      grouped.set(reference.href, { ...reference, concepts: [] });
    }
  }
  return [...grouped.values()];
}

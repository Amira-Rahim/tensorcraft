import { DeepOrbitTerms } from "./deep-orbit-terms";
import { useId } from "react";
import { DocumentationLink } from "@tensorcraft/ui";
import type { GlossaryEntry } from "@tensorcraft/content";

interface LessonTermsListProps {
  terms: GlossaryEntry[];
  worldId?: string;
}

type DocumentationKind = NonNullable<GlossaryEntry["documentation"]>["kind"];

/** What kind of reading each link is. A related API supplies a building
 *  block, not the whole concept, so it keeps a label of its own. */
const DOCUMENTATION_KIND_LABEL: Record<DocumentationKind, string> = {
  api: "API",
  guide: "Guide",
  "related-api": "Related API",
  background: "Background",
};

/**
 * The Takeaways step's closing list of the concept terms this lesson
 * underlined, with their definitions. Replaces the glossary rail (spec
 * 2026-09-23, section 3); the term chips in the prose already show their
 * own definition inline, so this is the look-back, not the first read.
 *
 * A reference sheet (2026-10-10): one row per term holds the headword, its
 * definition and where to read more, so the list spans the frame and leaves
 * no empty cell whatever the count (1 to 21 terms a lesson). The row grid
 * lives in globals.css under `.lesson-terms`.
 */
export function LessonTermsList({ terms, worldId }: LessonTermsListProps) {
  const headingId = useId();
  if (terms.length === 0) return null;
  if (worldId === "deep-orbit") return <DeepOrbitTerms terms={terms} />;

  return (
    <section
      aria-labelledby={headingId}
      data-testid="lesson-terms-list"
      className="lesson-terms mt-8 border border-border bg-surface-raised p-5"
    >
      <h2
        id={headingId}
        className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-primary"
      >
        Terms in this lesson
      </h2>
      <dl>
        {terms.map(({ term, definition, documentation }) => (
          <div
            key={term}
            data-testid={`glossary-entry-${term}`}
            className="lesson-terms-row"
          >
            <dt className="lesson-terms-term">{term}</dt>
            <dd className="lesson-terms-definition">{definition}</dd>
            {documentation && (
              <dd className="lesson-terms-source">
                {/* The source shows on the label but is read inside the link,
                    so a list of links still names it ("TensorFlow.js:
                    tf.tensor") and nothing is announced twice. */}
                <span className="lesson-terms-kind">
                  {DOCUMENTATION_KIND_LABEL[documentation.kind]}
                  <span aria-hidden="true"> ({documentation.source})</span>
                </span>
                <DocumentationLink reference={documentation}>
                  {/* The space sits outside the hidden span: a name computed
                      from the parts trims each one. */}
                  <span className="sr-only">{documentation.source}:</span>{" "}
                  {documentation.title}
                </DocumentationLink>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

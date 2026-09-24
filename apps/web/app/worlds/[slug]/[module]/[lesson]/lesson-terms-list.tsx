import { useId } from "react";

interface LessonTermsListProps {
  terms: Array<{ term: string; definition: string }>;
}

/**
 * The Takeaways step's closing list of the concept terms this lesson
 * underlined, with their definitions. Replaces the glossary rail (spec
 * 2026-09-23, section 3); the term chips in the prose already show their
 * own definition inline, so this is the look-back, not the first read.
 */
export function LessonTermsList({ terms }: LessonTermsListProps) {
  const headingId = useId();
  if (terms.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      data-testid="lesson-terms-list"
      className="mt-10"
    >
      <h2
        id={headingId}
        className="font-mono text-xs uppercase tracking-[0.2em] mb-4"
        style={{ color: "var(--tc-primary)" }}
      >
        Terms in this lesson
      </h2>
      <dl className="grid gap-x-10 gap-y-4 lg:grid-cols-2">
        {terms.map(({ term, definition }) => (
          <div
            key={term}
            data-testid={`glossary-entry-${term}`}
            className="flex flex-col gap-1"
          >
            <dt
              className="font-mono text-sm"
              style={{ color: "var(--tc-primary)" }}
            >
              {term}
            </dt>
            <dd
              className="text-sm leading-relaxed"
              style={{ color: "var(--tc-muted)" }}
            >
              {definition}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import { DocumentationLink } from "@tensorcraft/ui";
import type { LessonReference } from "@tensorcraft/content";

export function LessonDocumentation({
  references = [],
}: {
  references?: LessonReference[];
}) {
  if (references.length === 0) return null;
  const tfjs = references.filter(
    (reference) => reference.source === "TensorFlow.js",
  );
  const background = references.filter(
    (reference) => reference.source !== "TensorFlow.js",
  );
  function list(items: LessonReference[]) {
    return (
      <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {items.map((reference) => (
          <li key={reference.href} className="min-w-0 text-sm leading-relaxed">
            {reference.concepts.length > 0 && (
              <p className="mb-1 text-text-primary">
                {reference.concepts.join(", ")}
              </p>
            )}
            <DocumentationLink reference={reference} className="break-words" />
            {reference.kind === "related-api" && (
              <p className="mt-1 text-xs text-text-muted">
                Related API for this concept
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <details
      className="mt-8 border-t border-border pt-4"
      data-testid="lesson-documentation"
    >
      <summary className="min-h-11 cursor-pointer text-sm text-text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        Documentation for this lesson
      </summary>
      <div className="pb-4">
        <p className="mb-5 text-sm leading-relaxed text-text-muted">
          Optional references for the concepts and code above. Links open in a
          new tab so you can keep your place.
        </p>
        {tfjs.length > 0 && list(tfjs)}
        {background.length > 0 && (
          <div
            className={
              tfjs.length > 0 ? "mt-6 border-t border-border pt-5" : ""
            }
          >
            <h3 className="mb-2 text-sm font-semibold text-text-primary">
              Concept background
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-text-muted">
              These topics go beyond the TensorFlow.js reference. Sources with
              Python examples are labeled.
            </p>
            {list(background)}
          </div>
        )}
      </div>
    </details>
  );
}

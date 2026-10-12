"use client";

import { useId, useState } from "react";
import { DocumentationLink } from "@tensorcraft/ui";
import type { GlossaryEntry } from "@tensorcraft/content";
import { TensorTermFigure, type TensorTerm } from "./deep-orbit-tensor-figure";

const DEFINITIONS: Record<TensorTerm, string> = {
  tensor:
    "An array of numbers that TensorFlow.js uses for calculations and model inputs.",
  shape:
    "The size along each axis, written as a list. This tensor has one axis with three values.",
  dimensions:
    "Dimensions tell you how many axes a tensor has. A list has one axis; a table has two: rows and columns.",
};

function isTensorTerm(term: string): term is TensorTerm {
  return term === "tensor" || term === "shape" || term === "dimensions";
}

function TermDetail({ term }: { term: TensorTerm }) {
  if (term === "tensor")
    return (
      <>
        <code>tf.tensor([0.2, 0.4, 0.6])</code>
        <p>This creates one tensor holding three numbers.</p>
      </>
    );
  if (term === "shape")
    return (
      <p>
        <code>[3]</code> means one axis of length three. A table with two rows
        and three columns has shape <code>[2, 3]</code>.
      </p>
    );
  return (
    <p>
      <strong>Shape tells you the size along each axis.</strong> A table with 2
      rows and 3 columns has 2 dimensions and shape <code>[2, 3]</code>.
    </p>
  );
}

export function DeepOrbitTerms({ terms }: { terms: GlossaryEntry[] }) {
  const id = useId();
  const [selected, setSelected] = useState(terms[0]?.term);
  const entry = terms.find(({ term }) => term === selected) ?? terms[0];
  if (!entry) return null;
  const visual = isTensorTerm(entry.term);
  return (
    <details className="orbit-terms" data-testid="lesson-terms-list">
      <summary>
        <h2 className="orbit-section-heading">Review lesson terms</h2>
        <span className="orbit-expand-mark" aria-hidden="true" />
      </summary>
      <div className="orbit-glossary">
        <div
          className="orbit-term-picker"
          role="group"
          aria-label="Choose a lesson term"
        >
          {terms.map(({ term }) => (
            <button
              key={term}
              className="orbit-term-button"
              type="button"
              aria-pressed={entry.term === term}
              aria-controls={`${id}-content`}
              onClick={() => setSelected(term)}
            >
              {term.charAt(0).toUpperCase() + term.slice(1)}
            </button>
          ))}
        </div>
        <div
          className="orbit-glossary-body"
          id={`${id}-content`}
          data-illustrated={visual || undefined}
        >
          <div
            className="orbit-term-copy"
            aria-live="polite"
            aria-atomic="true"
            data-testid={`glossary-entry-${entry.term}`}
          >
            <p className="orbit-term-definition">
              {isTensorTerm(entry.term)
                ? DEFINITIONS[entry.term]
                : entry.definition}
            </p>
            {isTensorTerm(entry.term) && (
              <div className="orbit-term-detail">
                <TermDetail term={entry.term} />
              </div>
            )}
            {entry.documentation && (
              <div className="orbit-term-documentation">
                <span>
                  {entry.documentation.kind === "related-api"
                    ? "Related API"
                    : entry.documentation.kind === "background"
                      ? "Background reading"
                      : "Read more"}{" "}
                  in {entry.documentation.source}
                </span>
                <DocumentationLink reference={entry.documentation}>
                  <span className="sr-only">{entry.documentation.source}:</span>{" "}
                  {entry.documentation.title}
                </DocumentationLink>
              </div>
            )}
          </div>
          {isTensorTerm(entry.term) && <TensorTermFigure term={entry.term} />}
        </div>
      </div>
    </details>
  );
}

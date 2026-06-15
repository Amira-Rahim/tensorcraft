interface GlossaryTermProps {
  term: string;
  definition?: string;
  active?: boolean;
  onActivate?: (term: string) => void;
  children: React.ReactNode;
}

/** Concept term in prose: body color + accent dotted underline, linked to the
 *  rail glossary. Visually distinct from the inline-code chip. */
export function GlossaryTerm({
  term,
  definition,
  active,
  onActivate,
  children,
}: GlossaryTermProps) {
  return (
    <button
      type="button"
      data-glossary-term={term}
      title={definition}
      aria-label={definition ? `${term}: ${definition}` : term}
      onClick={() => onActivate?.(term)}
      className="inline cursor-help bg-transparent p-0 border-0 text-left"
      style={{
        color: "var(--tc-text)",
        borderBottom: "2px dotted var(--tc-accent)",
        background: active
          ? "color-mix(in srgb, var(--tc-accent) 16%, transparent)"
          : "transparent",
      }}
    >
      {children}
    </button>
  );
}

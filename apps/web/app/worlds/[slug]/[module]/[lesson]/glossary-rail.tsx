interface GlossaryRailProps {
  terms: Array<{ term: string; definition: string }>;
  activeTerm: string | null;
}

/** Sidebar list of concept terms + definitions for a lesson. Pure presentation;
 *  the active term is highlighted to mirror a clicked GlossaryTerm in prose. */
export function GlossaryRail({ terms, activeTerm }: GlossaryRailProps) {
  if (terms.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <span
        className="font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: "var(--tc-primary)" }}
      >
        Glossary
      </span>
      <dl className="flex flex-col gap-3">
        {terms.map(({ term, definition }) => {
          const isActive = activeTerm === term;
          return (
            <div
              key={term}
              data-testid={`glossary-entry-${term}`}
              data-active={isActive ? "true" : "false"}
              className="flex flex-col gap-1 pl-3"
              style={{
                background: isActive
                  ? "color-mix(in srgb, var(--tc-primary) 10%, transparent)"
                  : "transparent",
              }}
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
          );
        })}
      </dl>
    </div>
  );
}

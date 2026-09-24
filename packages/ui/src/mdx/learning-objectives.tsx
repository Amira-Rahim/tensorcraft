interface LearningObjectivesProps {
  objectives: string[];
}

export function LearningObjectives({ objectives }: LearningObjectivesProps) {
  return (
    <div className="min-w-0 [overflow-wrap:anywhere] p-5 brutalist-shadow bg-surface-raised border border-border">
      {/* Inline metrics on purpose: this heading renders inside .lesson-prose,
          whose unlayered `.lesson-prose h2` rule in apps/web/app/globals.css
          outranks Tailwind's layered utilities and would set it to 1.5rem,
          weight 700, text colour, with a 2.5em top margin. Every property
          that rule sets is pinned here. */}
      <h2
        className="font-mono uppercase tracking-widest"
        style={{
          fontSize: "0.75rem",
          lineHeight: "1rem",
          fontWeight: 600,
          margin: "0 0 0.75rem",
          color: "var(--tc-primary)",
        }}
      >
        You will be able to
      </h2>
      {/* The list and its items render inside .lesson-prose too, whose
          unlayered ul and li rules in apps/web/app/globals.css would indent
          the list, space the items and set the body text size; pinned inline
          like the heading. */}
      <ul
        role="list"
        className="grid gap-x-8 gap-y-2 lg:grid-cols-2"
        style={{ paddingLeft: 0, margin: 0 }}
      >
        {objectives.map((obj) => (
          <li
            key={obj}
            className="flex items-start gap-2 text-text-primary/80"
            style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.625 }}
          >
            {/* Decorative: without aria-hidden, VoiceOver reads "white
                circle" before every objective. */}
            <span
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-xs text-primary"
            >
              ○
            </span>
            <span className="min-w-0">{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

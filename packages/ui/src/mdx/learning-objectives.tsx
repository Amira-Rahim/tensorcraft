interface LearningObjectivesProps {
  objectives: string[];
}

export function LearningObjectives({ objectives }: LearningObjectivesProps) {
  return (
    <div
      className="rounded-[14px] p-5 my-6"
      style={{
        background: "var(--tc-surface, #0F1320)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h4
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "var(--tc-accent, #00D4FF)" }}
      >
        Learning Objectives
      </h4>
      <ul className="flex flex-col gap-2">
        {objectives.map((obj) => (
          <li
            key={obj}
            className="flex items-start gap-2 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            <span
              className="mt-0.5 text-xs"
              style={{ color: "var(--tc-accent, #00D4FF)" }}
            >
              ○
            </span>
            {obj}
          </li>
        ))}
      </ul>
    </div>
  );
}

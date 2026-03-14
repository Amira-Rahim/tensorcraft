interface LearningObjectivesProps {
  objectives: string[];
}

export function LearningObjectives({ objectives }: LearningObjectivesProps) {
  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Learning Objectives
      </h4>
      <ul className="flex flex-col gap-2">
        {objectives.map((obj) => (
          <li
            key={obj}
            className="flex items-start gap-2 text-sm leading-relaxed text-text-primary/80"
          >
            <span className="mt-0.5 text-xs text-primary">○</span>
            {obj}
          </li>
        ))}
      </ul>
    </div>
  );
}

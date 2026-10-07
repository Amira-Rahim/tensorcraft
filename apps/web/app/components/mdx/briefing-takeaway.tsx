import type { ReactNode } from "react";

interface BriefingTakeawayProps {
  children: ReactNode;
  task: string;
  next: string;
  readings?: number[];
  readingsLabel?: string;
}

/** The idea to carry from the opening scene into the learner's first task. */
export function BriefingTakeaway({
  children,
  task,
  next,
  readings,
  readingsLabel = "JavaScript array",
}: BriefingTakeawayProps) {
  return (
    <aside
      className="briefing-takeaway"
      aria-label="Key idea and first task"
      data-testid="briefing-takeaway"
    >
      <div className="briefing-takeaway-idea">
        <h2>Key idea</h2>
        <div className="briefing-takeaway-definition">{children}</div>
      </div>
      <div className="briefing-takeaway-task">
        <h3>Your first task</h3>
        <p>{task}</p>
        {readings && (
          <figure className="briefing-takeaway-readings">
            <figcaption>{readingsLabel}</figcaption>
            <code>[{readings.join(", ")}]</code>
          </figure>
        )}
        <p className="briefing-takeaway-next">{next}</p>
      </div>
    </aside>
  );
}

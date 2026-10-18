import { ProseText } from "@tensorcraft/ui/prose-text";
import type { ReactNode } from "react";

interface BriefingTakeawayProps {
  children: ReactNode;
  task: string;
  next?: string;
  readings?: number[];
  readingsLabel?: string;
  part?: "idea" | "task";
  shapes?: Array<{ label: string; shape: [number] | [number, number] }>;
  example?: ReactNode;
}

/** The idea to carry from the opening scene into the learner's first task. */
export function BriefingTakeaway({
  children,
  task,
  next,
  readings,
  readingsLabel = "Readings",
  part,
  shapes,
  example,
}: BriefingTakeawayProps) {
  return (
    <aside
      className="briefing-takeaway"
      aria-label={
        part === "idea"
          ? "Key idea"
          : part === "task"
            ? "Your first task"
            : "Key idea and first task"
      }
      data-testid="briefing-takeaway"
      data-part={part}
    >
      {part !== "task" && (
        <div className="briefing-takeaway-idea">
          <h2>Key idea</h2>
          <div className="briefing-takeaway-definition">
            <ProseText>{children}</ProseText>
          </div>
          {shapes && (
            <div className="briefing-shape-examples">
              {shapes.map(({ label, shape }) => (
                <figure key={label} className="briefing-shape-example">
                  <figcaption>{label}</figcaption>
                  <div
                    className="briefing-shape-cells"
                    style={{
                      gridTemplateColumns: `repeat(${shape.at(-1)}, var(--briefing-cell-size))`,
                    }}
                    aria-hidden="true"
                  >
                    {Array.from(
                      { length: shape.reduce((a, b) => a * b, 1) },
                      (_, index) => (
                        <span key={index} />
                      ),
                    )}
                  </div>
                  <code>[{shape.join(", ")}]</code>
                </figure>
              ))}
            </div>
          )}
          {example}
        </div>
      )}
      {part !== "idea" && (
        <div className="briefing-takeaway-task">
          <header className="briefing-task-heading">
            <h3>Your first task</h3>
            <p>
              <ProseText>{task}</ProseText>
            </p>
          </header>
          {readings && (
            <figure className="briefing-takeaway-readings">
              <figcaption>{readingsLabel}</figcaption>
              <div
                className="briefing-readings-scroll"
                data-no-swipe=""
                role="region"
                aria-label={`${readingsLabel}. Scroll horizontally if needed.`}
                tabIndex={0}
              >
                <div className="briefing-readings-array">
                  <span className="briefing-array-bracket" aria-hidden="true">
                    [
                  </span>
                  <ol aria-label="Readings in array order">
                    {readings.map((reading, index) => (
                      <li key={index}>
                        <span>{reading}</span>
                        {index < readings.length - 1 && (
                          <span
                            className="briefing-array-comma"
                            aria-hidden="true"
                          >
                            ,
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                  <span className="briefing-array-bracket" aria-hidden="true">
                    ]
                  </span>
                </div>
              </div>
              <p className="briefing-readings-scroll-hint">
                Scroll sideways if needed.
              </p>
            </figure>
          )}
          {next && (
            <p className="briefing-takeaway-next">
              <ProseText>{next}</ProseText>
            </p>
          )}
        </div>
      )}
    </aside>
  );
}

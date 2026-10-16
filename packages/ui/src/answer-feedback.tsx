import type { ReactNode } from "react";

type AnswerStatus = "correct" | "incorrect" | "neutral";

/** Keep this mounted so a submitted answer updates an existing live region. */
export function AnswerFeedback({
  status,
  title,
  children,
  id,
  className = "",
  announce = true,
}: {
  status: AnswerStatus | null;
  title?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
  announce?: boolean;
}) {
  const appearance =
    status === "correct"
      ? "border-success/40 bg-success/10"
      : status === "incorrect"
        ? "border-error/50 bg-error/10"
        : "border-border bg-surface";
  const heading =
    title ??
    (status === "correct"
      ? "Correct!"
      : status === "incorrect"
        ? "Not quite. That’s incorrect."
        : undefined);

  return (
    <div
      id={id}
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-atomic={announce ? "true" : undefined}
      data-feedback-state={status ?? undefined}
      className={
        `${status ? `space-y-2 border p-4 ${appearance}` : ""} ${className}`.trim() ||
        undefined
      }
    >
      {status && heading && (
        <p>
          <strong
            style={{
              color:
                status === "correct"
                  ? "var(--tc-success)"
                  : status === "incorrect"
                    ? "var(--tc-error)"
                    : "var(--tc-text)",
            }}
          >
            {heading}
          </strong>
        </p>
      )}
      {children}
    </div>
  );
}

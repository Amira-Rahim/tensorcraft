import type { ReactNode } from "react";

/** Collapsed during the first read; expanded in the worked-code phase. */
export function ConceptReference({
  summary,
  children,
  open = false,
}: {
  summary: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="my-6 border border-border p-4">
      <summary className="min-h-11 cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-primary">
        {summary}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

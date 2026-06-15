interface LessonShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightKind: "rail" | "pane" | "none";
  chrome?: React.ReactNode;
}

/**
 * Presentational two-column shell for the lesson reader.
 *
 * - rightKind="none"  -> single centered column (900px cap, current reading width)
 * - rightKind="rail"  -> lg+ two columns: flexible prose | fixed 360px sidebar
 * - rightKind="pane"  -> lg+ two columns: 1fr prose | 1fr interactive pane
 *
 * Below lg, rail/pane both collapse to single column (right stacks below left).
 * The chrome slot (progress bar, nav) renders above the grid when provided.
 */
export function LessonShell({
  left,
  right,
  rightKind,
  chrome,
}: LessonShellProps) {
  const isSingleColumn = rightKind === "none";

  if (isSingleColumn) {
    return (
      <div className="flex flex-col">
        {chrome && <div>{chrome}</div>}
        <div className="mx-auto w-full max-w-[900px] px-6 md:px-12">{left}</div>
      </div>
    );
  }

  const gridCols =
    rightKind === "rail"
      ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]"
      : "grid-cols-1 lg:grid-cols-2";

  return (
    <div className="flex flex-col">
      {chrome && <div>{chrome}</div>}
      <div className={`mx-auto w-full max-w-[1200px] px-6 md:px-12`}>
        <div className={`grid ${gridCols} gap-8`}>
          <div className="max-w-[68ch]">{left}</div>
          <div
            data-testid="lesson-right"
            data-kind={rightKind}
            className="border-l border-border"
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}

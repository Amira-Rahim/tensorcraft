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
 * Below lg, "rail" collapses to a single column and stacks below the prose.
 *
 * "pane" is different and must NOT stack: below lg the caller owns the pane
 * itself, swapping prose and pane behind a toggle inside `left`. This slot
 * used to render at every width, so on a phone the pane mounted TWICE —
 * once here and once inside the toggle. For the exercise step that meant two
 * live Sandpack editors sharing one `tc-code-{slug}` localStorage key and two
 * "Run Tests" buttons, i.e. two code buffers racing on the graded path. It
 * also broke the single-submit invariant the caller documents. Desktop was
 * always correct, which is why it survived the desktop-only e2e projects.
 *
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
            className={`border-l border-border ${
              // See the note above: for "pane" the caller renders this same
              // content behind a mobile toggle, so showing it here below lg
              // mounted the interactive pane twice.
              rightKind === "pane" ? "hidden lg:block" : ""
            }`}
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}

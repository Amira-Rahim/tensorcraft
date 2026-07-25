interface LessonShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightKind: "rail" | "pane" | "none";
  chrome?: React.ReactNode;
  /**
   * "pane" only: show the pane below lg. The caller's mobile toggle drives
   * this instead of mounting its own second copy of the pane.
   */
  paneOpenOnMobile?: boolean;
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
 * "pane" is SINGLE-MOUNT by contract (fresh-eyes rerun §6 / R3-7): this slot
 * is the ONLY place the pane renders, at every width. The first fix for the
 * mobile double-mount hid this slot below lg while the caller mounted its
 * own copy behind a toggle — which was CSS-only: two live Sandpack editors
 * still mounted at every viewport, racing one `tc-code-{slug}` key, showing
 * a stale buffer after a rotate across lg, and doubling CPU on the graded
 * path. Now the caller passes `paneOpenOnMobile` and the same single
 * instance toggles visibility — React keeps it mounted through the toggle,
 * so editor state survives open/close and orientation changes.
 *
 * The chrome slot (progress bar, nav) renders above the grid when provided.
 */
export function LessonShell({
  left,
  right,
  rightKind,
  chrome,
  paneOpenOnMobile = false,
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

  // Pane visibility below lg follows the caller's toggle; lg+ always shows.
  // The border is a desktop column divider only.
  const rightClasses =
    rightKind === "pane"
      ? `lg:border-l border-border ${paneOpenOnMobile ? "block" : "hidden"} lg:block`
      : "border-l border-border";

  return (
    <div className="flex flex-col">
      {chrome && <div>{chrome}</div>}
      <div className={`mx-auto w-full max-w-[1200px] px-6 md:px-12`}>
        <div className={`grid ${gridCols} gap-8`}>
          <div className="max-w-[68ch]">{left}</div>
          <div
            data-testid="lesson-right"
            data-kind={rightKind}
            className={rightClasses}
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}

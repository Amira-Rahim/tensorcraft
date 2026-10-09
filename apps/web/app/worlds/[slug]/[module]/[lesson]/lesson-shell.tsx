interface LessonShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightKind: "pane" | "code" | "none";
  chrome?: React.ReactNode;
  controls?: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  workspace?: boolean;
  workspaceFocusRef?: React.Ref<HTMLDivElement>;
  workspaceLabel?: string;
  paneOpenOnMobile?: boolean;
  fullWidth?: boolean;
}

/* The grid's classes per kind, each string whole: Tailwind emits a rule only
   for a class it finds whole in the source, so these are never assembled by
   interpolation. "none" and "code" are one column with no gap utility:
   "none" has one slot, and the Code step stacks its two slots with no row
   gap, because grid items do not collapse margins, so the left slot's
   trailing 24 px is the whole gap above the worked example (globals.css
   strips the code slot's own block margins to match; spec section 4,
   amended). "pane" sets its slots side by side from lg with the 40 px
   gutter and shows one at a time below it, so it needs no row gap either. */
const GRID_CLASS: Record<LessonShellProps["rightKind"], string> = {
  none: "grid grid-cols-1",
  code: "grid grid-cols-1",
  pane: "grid gap-x-10 lg:grid-cols-[minmax(0,min(440px,38%))_minmax(0,1fr)]",
};

/**
 * Reading and exercise frames stay at 1,280 px with 48 px side padding.
 * Briefing uses the full page width for its title; its story and navigation
 * keep their own reading frame. "code" is single column (the
 * worked example uses the full width; derivations stack above it in the
 * left slot). "pane" is the Challenge: instructions on a track of 440 px,
 * or 38% of the grid where that is narrower so the editor keeps its width
 * on small desktops; the editor takes the rest, with one mounted editor at
 * every width. "none" is a single column. The Challenge gutter repeats a
 * spacing token in globals.css: gap-x-10 is --l-gutter (see GRID_CLASS).
 */
export function LessonShell({
  left,
  right,
  rightKind,
  chrome,
  controls,
  footer,
  header,
  workspace = false,
  workspaceFocusRef,
  workspaceLabel,
  paneOpenOnMobile = false,
  fullWidth = false,
}: LessonShellProps) {
  const single = rightKind === "none";
  const pane = rightKind === "pane";
  return (
    <div className="flex flex-col">
      {chrome}
      <div
        data-testid="lesson-frame"
        ref={workspace ? workspaceFocusRef : undefined}
        role={workspace ? "group" : undefined}
        tabIndex={workspace ? -1 : undefined}
        aria-label={workspace ? workspaceLabel : undefined}
        className={`mx-auto w-full px-5 md:px-12 ${fullWidth ? "" : "max-w-7xl"} ${workspace ? "lesson-challenge-workspace outline-none" : ""}`}
      >
        {header}
        {controls}
        <div
          data-testid="lesson-grid"
          className={
            workspace ? "challenge-workspace-grid" : GRID_CLASS[rightKind]
          }
        >
          <div
            className={`min-w-0 ${!workspace && pane && paneOpenOnMobile ? "hidden lg:block" : ""}`}
          >
            {left}
          </div>
          {!single && (
            <div
              data-testid="lesson-right"
              data-kind={rightKind}
              className={`min-w-0 ${!workspace && pane ? `lg:border-l lg:pl-5 lg:-ml-5 border-border ${paneOpenOnMobile ? "block" : "hidden"} lg:block` : ""}`}
            >
              {right}
            </div>
          )}
        </div>
        {footer}
      </div>
    </div>
  );
}

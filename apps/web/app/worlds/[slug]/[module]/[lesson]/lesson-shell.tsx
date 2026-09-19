interface LessonShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
  rightKind: "rail" | "pane" | "code" | "none";
  chrome?: React.ReactNode;
  controls?: React.ReactNode;
  footer?: React.ReactNode;
  paneOpenOnMobile?: boolean;
}

/** One mounted editor at every width. Code examples use the full column;
 * challenges keep notes beside the editor on desktop and switch views on mobile. */
export function LessonShell({
  left,
  right,
  rightKind,
  chrome,
  controls,
  footer,
  paneOpenOnMobile = false,
}: LessonShellProps) {
  const single = rightKind === "none";
  const code = rightKind === "code";
  const pane = rightKind === "pane";
  return (
    <div className="flex flex-col">
      {chrome}
      <div
        className={`mx-auto w-full px-5 sm:px-6 md:px-10 ${single ? "max-w-[900px]" : code ? "max-w-[1100px]" : "max-w-[1280px]"}`}
      >
        {controls}
        <div
          className={`grid gap-8 ${rightKind === "rail" ? "lg:grid-cols-[minmax(0,1fr)_320px]" : pane ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "grid-cols-1"}`}
        >
          <div
            className={`min-w-0 ${code ? "" : "max-w-[68ch]"} ${pane && paneOpenOnMobile ? "hidden lg:block" : ""}`}
          >
            {left}
          </div>
          {!single && (
            <div
              data-testid="lesson-right"
              data-kind={rightKind}
              className={`min-w-0 ${pane ? `lg:border-l lg:pl-6 border-border ${paneOpenOnMobile ? "block" : "hidden"} lg:block` : rightKind === "rail" ? "border-t pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 border-border" : ""}`}
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

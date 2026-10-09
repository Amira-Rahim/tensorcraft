"use client";

/**
 * The "tests passed" moment on the challenge step, plus the unlocked
 * Continue.
 *
 * Extracted from lesson-steps.tsx on 2026-08-23 to fix an announcement bug.
 * The banner used to mount `role="status"` together with its own text, and a
 * polite live region inserted at the same instant as its content is announced
 * unreliably: assistive technology has nothing to observe changing. The
 * pending poller was fixed for exactly this; the banner was the last site
 * still carrying it.
 *
 * So the region is always mounted and only its TEXT changes. The visual
 * banner stays conditional, because an empty bordered box would be nonsense
 * to sighted users. Splitting the two is what lets both audiences get the
 * right thing.
 *
 * Placement note kept from the original (2026-07-14 UX audit): the pass and
 * the way forward used to live in opposite columns. They belong together,
 * right where the pass landed.
 */
export function ChallengePassedBanner({
  passed,
  exerciseCount,
  checkedWork = [],
  onContinue,
  compact = false,
}: {
  passed: boolean;
  exerciseCount: number;
  checkedWork?: string[];
  onContinue: () => void;
  compact?: boolean;
}) {
  const message =
    exerciseCount > 1 ? "All exercises passed" : "Exercise passed";

  return (
    <>
      <p role="status" className="sr-only">
        {passed
          ? `${message}${checkedWork.length ? `. Checked: ${checkedWork.join("; ")}.` : ""}`
          : ""}
      </p>

      {passed && (
        <div
          data-testid="challenge-passed-banner"
          className="mt-(--l-row) flex flex-wrap items-center justify-between gap-(--l-nav-inner) border px-5 py-4"
          style={{
            borderColor: "var(--tc-primary)",
            background: "color-mix(in srgb, var(--tc-primary) 8%, transparent)",
          }}
        >
          <div className="min-w-0 flex-1 basis-48">
            <p
              className={
                compact
                  ? "text-lg font-bold"
                  : "font-mono text-xs uppercase tracking-widest"
              }
              style={{ color: "var(--tc-primary)" }}
            >
              {message}
            </p>
            {!compact && checkedWork.length > 0 && (
              <ul
                className="mt-2 space-y-1 text-sm leading-relaxed"
                aria-label="Checked work"
              >
                {checkedWork.map((title, index) => (
                  <li key={`${index}-${title}`}>{title}</li>
                ))}
              </ul>
            )}
            {!compact && (
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--tc-muted)" }}
              >
                Check your reasoning next, then follow the crew into the next
                scene.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="text-sm font-mono font-bold px-6 py-2.5"
            style={{
              background: "var(--tc-primary)",
              color: "var(--tc-on-primary)",
            }}
          >
            Continue &rarr;
          </button>
        </div>
      )}
    </>
  );
}

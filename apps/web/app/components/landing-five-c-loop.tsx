/**
 * 5C lesson loop — pedagogical pattern used by every Tensorcraft lesson.
 *
 *  1. Context     — why this concept matters, anchored to something you know.
 *  2. Code        — a small, editable example you can run in-browser.
 *  3. Callout     — the specific FE ↔ ML bridge, stated plainly.
 *  4. Checkpoint  — a quick comprehension check before moving on.
 *  5. Conclusion  — the one line you should walk away with.
 *
 * Rendered as five square brutalist cards connected by `→` arrows.
 */

const STAGES = [
  {
    num: "01",
    name: "Context",
    desc: "Why this concept matters, anchored to something you already ship every week.",
  },
  {
    num: "02",
    name: "Code",
    desc: "An editable, runnable JS example — no setup, no Python, no backend.",
  },
  {
    num: "03",
    name: "Callout",
    desc: "The specific FE ↔ ML bridge stated plainly, with a tier label.",
  },
  {
    num: "04",
    name: "Checkpoint",
    desc: "A quick prompt that proves you can use the idea, not just read it.",
  },
  {
    num: "05",
    name: "Conclusion",
    desc: "The one sentence worth keeping in your head before the next lesson.",
  },
] as const;

export function LandingFiveCLoop() {
  return (
    <section
      id="five-c-loop"
      data-testid="landing-five-c-loop"
      aria-labelledby="five-c-loop-heading"
      className="border-b border-border"
    >
      <div className="px-10 md:px-20 pt-16 pb-10">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3">
          // EVERY LESSON, EVERY TIME
        </div>
        <h2
          id="five-c-loop-heading"
          className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3 uppercase"
        >
          The 5C Loop
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[560px] font-sans">
          Every lesson follows the same five-stage shape so nothing is ever a
          surprise — only the concept changes.
        </p>
      </div>

      <ol
        data-testid="five-c-stages"
        className="list-none border-t border-border grid grid-cols-1 md:grid-cols-5"
      >
        {STAGES.map((stage, i) => {
          const isLast = i === STAGES.length - 1;
          return (
            <li
              key={stage.num}
              data-testid="five-c-stage"
              data-stage-num={stage.num}
              className="relative px-6 md:px-7 py-8 border-b md:border-b-0 border-border min-w-0 overflow-hidden"
              style={{
                borderRight: isLast ? "none" : "1px solid var(--tc-border)",
              }}
            >
              <div
                aria-hidden="true"
                className="font-mono text-[11px] text-text-muted tracking-[0.2em] uppercase mb-3"
              >
                Stage {stage.num}
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <div className="font-mono text-2xl font-black text-primary leading-none">
                  {stage.num}
                </div>
                <div className="font-mono text-lg font-bold text-text-primary uppercase tracking-tight">
                  {stage.name}
                </div>
              </div>
              <p className="text-[13px] text-text-muted leading-relaxed font-sans">
                {stage.desc}
              </p>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="hidden md:flex absolute top-1/2 -right-[11px] -translate-y-1/2 w-5 h-5 items-center justify-center font-mono text-sm bg-page text-primary"
                >
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export { STAGES as FIVE_C_STAGES };

import {
  getWorldLessons,
  getModuleLessons,
  getLessonExercises,
} from "@tensorcraft/content";

/**
 * Git-log-styled proof panel: what the learner's tensorcraft-deep-orbit
 * repo looks like after module 1. Every line is generated from the REAL
 * module-1 exercise corpus and the EXACT commit-message format the push
 * pipeline writes (apps/api/src/lib/github.ts commitLessonArtifact), so
 * this marketing surface cannot drift from the product. No fabricated
 * activity: the honesty line below the log says exactly what this is.
 */
export function CommitTrail({ compact = false }: { compact?: boolean }) {
  const foundationLessons = getModuleLessons("deep-orbit", "foundations");
  const commits = foundationLessons.flatMap((l) =>
    getLessonExercises(l.slug).map((ex) => ({
      msg: `feat(foundations): Complete exercise -- ${ex.slug}`,
      file: `foundations/${ex.slug}.ts`,
    })),
  );
  const totalExercises = getWorldLessons("deep-orbit").reduce(
    (sum, l) => sum + getLessonExercises(l.slug).length,
    0,
  );
  const shown = compact ? commits.slice(0, 3) : commits;

  return (
    <div
      data-testid="commit-trail"
      className="border border-border bg-code-bg font-mono text-left"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-text-muted">
          <span className="text-primary">your-github</span>
          /tensorcraft-deep-orbit
        </span>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          after module 1
        </span>
      </div>
      <ul className="divide-y divide-border/50">
        {shown.map((c) => (
          <li key={c.file} className="px-4 py-2.5">
            <p className="text-xs text-text-primary truncate">
              <span aria-hidden="true" className="text-primary">
                ●{" "}
              </span>
              {c.msg}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 pl-4">{c.file}</p>
          </li>
        ))}
      </ul>
      {/* The "generated" clause is the honesty line: this panel must never
          read as a real user's activity. Keep it when editing this copy. */}
      <p className="px-4 py-2.5 border-t border-border text-[11px] text-text-muted">
        +{totalExercises - shown.length} more commits by the time you reach the
        capstone, one per solved exercise, generated in the exact format we push
        to your repo.
      </p>
    </div>
  );
}

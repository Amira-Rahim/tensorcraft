import { ProseText } from "../prose-text";
interface LessonRecapProps {
  whatYouLearned: string[];
  bridge: string;
  youCanNow: string;
}

export function LessonRecap({
  whatYouLearned,
  bridge,
  youCanNow,
}: LessonRecapProps) {
  return (
    // The lesson-recap-* classes are the app's layout hooks: at a wide card
    // the learned list takes the left column and the other two stack on the
    // right (apps/web globals.css, 2026-10-10).
    <div className="lesson-recap min-w-0 [overflow-wrap:anywhere] p-5 my-8 bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-4 text-primary">
        Lesson Recap
      </h4>

      <div className="lesson-recap-sections flex flex-col gap-4">
        <section className="lesson-recap-learned">
          <p className="lesson-recap-label text-xs font-mono uppercase tracking-wider text-primary/90 mb-1">
            What you learned
          </p>
          <ul className="flex flex-col gap-2">
            {whatYouLearned.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm leading-relaxed text-text-primary/80"
              >
                <span className="mt-0.5 shrink-0 text-primary">&#x2713;</span>
                <span className="min-w-0">
                  <ProseText>{item}</ProseText>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="lesson-recap-label text-xs font-mono uppercase tracking-wider text-primary/90 mb-1">
            The bridge
          </p>
          <p className="lesson-recap-text text-sm leading-relaxed text-text-primary/80">
            <ProseText>{bridge}</ProseText>
          </p>
        </section>

        <section>
          <p className="lesson-recap-label text-xs font-mono uppercase tracking-wider text-primary/90 mb-1">
            You can now
          </p>
          <p className="lesson-recap-text text-sm leading-relaxed text-text-primary/80">
            <ProseText>{youCanNow}</ProseText>
          </p>
        </section>
      </div>
    </div>
  );
}

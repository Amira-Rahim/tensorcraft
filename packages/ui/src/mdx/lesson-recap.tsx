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
    <div className="min-w-0 [overflow-wrap:anywhere] p-5 my-8 bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-4 text-primary">
        Lesson Recap
      </h4>

      <div className="flex flex-col gap-4">
        <section>
          <p className="text-xs font-mono uppercase tracking-wider text-primary/90 mb-1">
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
          <p className="text-xs font-mono uppercase tracking-wider text-primary/90 mb-1">
            The bridge
          </p>
          <p className="text-sm leading-relaxed text-text-primary/80">
            <ProseText>{bridge}</ProseText>
          </p>
        </section>

        <section>
          <p className="text-xs font-mono uppercase tracking-wider text-primary/90 mb-1">
            You can now
          </p>
          <p className="text-sm leading-relaxed text-text-primary/80">
            <ProseText>{youCanNow}</ProseText>
          </p>
        </section>
      </div>
    </div>
  );
}

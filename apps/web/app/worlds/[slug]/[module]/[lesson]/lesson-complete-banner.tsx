import { ProseText } from "@tensorcraft/ui/prose-text";

/** The same completion landmark on every lesson, using its world's vocabulary. */
export function LessonCompleteBanner({
  outcome,
  lessonTerm,
}: {
  outcome: string;
  lessonTerm: string;
}) {
  return (
    <header className="lesson-complete-banner">
      <svg
        className="lesson-complete-mark"
        viewBox="0 0 24 24"
        width="56"
        height="56"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 4.5 4.5L19 7" />
      </svg>
      <h2 className="lesson-complete-title">{lessonTerm} complete</h2>
      <p className="lesson-complete-outcome">
        <ProseText>{outcome}</ProseText>
      </p>
    </header>
  );
}

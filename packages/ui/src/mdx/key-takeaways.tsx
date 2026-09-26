// DEPRECATED: replaced by RecallPrompt/LessonRecap in the lesson close; retained for unbuilt coming-soon world MDX. See docs/superpowers/specs/2026-06-15-end-of-lesson-design.md
interface KeyTakeawaysProps {
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  return (
    <div className="p-5 my-8 bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Key Takeaways
      </h4>
      <ul className="flex flex-col gap-2">
        {takeaways.map((t) => (
          <li
            key={t}
            className="flex items-start gap-2 text-sm leading-relaxed text-text-primary/80"
          >
            <span className="mt-0.5 text-primary">✓</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

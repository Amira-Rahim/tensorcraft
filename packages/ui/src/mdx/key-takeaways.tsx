interface KeyTakeawaysProps {
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  return (
    <div className="p-5 my-8 brutalist-shadow bg-surface-raised border-l-[3px] border-l-primary">
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

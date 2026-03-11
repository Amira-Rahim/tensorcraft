interface KeyTakeawaysProps {
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  return (
    <div
      className="rounded-[14px] p-5 my-8"
      style={{
        background: "var(--tc-surface, #0F1320)",
        borderLeft: "3px solid var(--tc-accent, #00D4FF)",
      }}
    >
      <h4
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "var(--tc-accent, #00D4FF)" }}
      >
        Key Takeaways
      </h4>
      <ul className="flex flex-col gap-2">
        {takeaways.map((t) => (
          <li
            key={t}
            className="flex items-start gap-2 text-sm leading-relaxed"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            <span
              className="mt-0.5"
              style={{ color: "var(--tc-accent, #00D4FF)" }}
            >
              ✓
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

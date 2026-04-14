import type { ReactNode } from "react";

interface DialogueProps {
  speaker: string;
  children: ReactNode;
}

export function Dialogue({ speaker, children }: DialogueProps) {
  return (
    <blockquote
      className="my-8 pl-6 py-4 not-italic"
      style={{
        borderLeft: "3px solid var(--tc-accent, #A89060)",
        background: "var(--tc-surface, #252525)",
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      <span
        className="not-italic text-xs font-bold uppercase tracking-widest block mb-2"
        style={{ color: "var(--tc-accent, #A89060)" }}
      >
        {speaker}
      </span>
      <div
        className="text-base leading-relaxed font-sans"
        style={{ color: "var(--tc-text, #E0E0E0)" }}
      >
        {children}
      </div>
    </blockquote>
  );
}

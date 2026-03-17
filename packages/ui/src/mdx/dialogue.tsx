import type { ReactNode } from "react";

interface DialogueProps {
  speaker: string;
  children: ReactNode;
}

export function Dialogue({ speaker, children }: DialogueProps) {
  return (
    <blockquote
      className="my-5 border-l-2 pl-5 text-primary"
      style={{ borderColor: "var(--tc-accent, #A89060)" }}
    >
      <span
        className="not-italic text-xs font-semibold uppercase tracking-widest block mb-1"
        style={{ color: "var(--tc-accent, #A89060)" }}
      >
        {speaker}
      </span>
      <div
        className="text-base leading-relaxed"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        {children}
      </div>
    </blockquote>
  );
}

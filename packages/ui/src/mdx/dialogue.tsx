import type { ReactNode } from "react";

interface DialogueProps {
  speaker: string;
  direction?: string;
  children: ReactNode;
}

export function Dialogue({ speaker, direction, children }: DialogueProps) {
  return (
    <div className="mb-7">
      <div
        className="font-mono text-xs font-bold uppercase tracking-[2px] mb-1.5"
        style={{ color: "var(--tc-text, #E0E0E0)" }}
      >
        {speaker}
      </div>
      {direction && (
        <div
          className="text-[13px] italic mb-1"
          style={{ color: "var(--tc-muted, #A0A0A0)" }}
          data-testid="direction"
        >
          ({direction})
        </div>
      )}
      <div
        className="text-[15px] leading-relaxed max-w-[560px]"
        style={{ color: "var(--tc-text, #c8c8c8)" }}
      >
        {children}
      </div>
    </div>
  );
}

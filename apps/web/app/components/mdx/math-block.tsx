import type { ReactNode } from "react";

interface MathBlockProps {
  children: ReactNode;
  label?: string;
}

export function MathBlock({ children, label }: MathBlockProps) {
  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      {label && (
        <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted block mb-3">
          {label}
        </span>
      )}
      <div className="text-center font-mono text-text-primary text-base leading-relaxed overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

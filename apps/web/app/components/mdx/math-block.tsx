import type { ReactNode } from "react";

interface MathBlockProps {
  /** App-level API: render arbitrary children */
  children?: ReactNode;
  label?: string;
  /** Package-level API: render a math expression string */
  expression?: string;
  /** When true (default), renders as a block; when false, renders inline. Only applies to `expression`. */
  display?: boolean;
}

export function MathBlock({
  children,
  label,
  expression,
  display = true,
}: MathBlockProps) {
  // Package-level API: expression string rendered in a code block
  if (expression !== undefined) {
    if (!display) {
      return (
        <code className="inline-block align-middle mx-0.5 font-mono text-text-primary">
          {expression}
        </code>
      );
    }

    return (
      <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
        {label && (
          <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted block mb-3">
            {label}
          </span>
        )}
        <div className="text-center font-mono text-text-primary text-base leading-relaxed overflow-x-auto">
          <code>{expression}</code>
        </div>
      </div>
    );
  }

  // App-level API: render children directly
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

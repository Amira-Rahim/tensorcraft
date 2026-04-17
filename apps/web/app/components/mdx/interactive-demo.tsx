"use client";

import type { ReactNode } from "react";

interface InteractiveDemoProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function InteractiveDemo({
  title,
  description,
  children,
}: InteractiveDemoProps) {
  return (
    <div className="my-6 brutalist-shadow bg-surface-raised border border-border">
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-border"
        style={{ background: "var(--tc-surface, #232323)" }}
      >
        <span className="w-2 h-2 bg-primary" />
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          {title}
        </span>
      </div>

      {/* Content area */}
      <div className="p-5">
        {description && (
          <p className="text-sm leading-relaxed mb-4 text-text-muted">
            {description}
          </p>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}

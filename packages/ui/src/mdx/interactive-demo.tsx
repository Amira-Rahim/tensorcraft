"use client";

import type { ReactNode } from "react";

interface InteractiveDemoProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function InteractiveDemo({
  title,
  description,
  children,
}: InteractiveDemoProps) {
  return (
    <div className="p-6 my-6 brutalist-shadow bg-surface-raised border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">▶</span>
        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          Interactive Demo
        </h4>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed mb-4 text-text-primary/65">
        {description}
      </p>

      {/* Content slot */}
      <div className="p-4 bg-surface border border-border">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";

export interface DocumentationLinkTarget {
  href: string;
  title: string;
  source: string;
  kind: "api" | "guide" | "related-api" | "background";
}

export function DocumentationLink({
  reference,
  children,
  className = "",
}: {
  reference: DocumentationLinkTarget;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={reference.href}
      target="_blank"
      rel="noopener noreferrer"
      title={`${reference.source}: ${reference.title} (opens in a new tab)`}
      className={`text-primary underline decoration-current/50 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${className}`}
    >
      {children ?? `${reference.source}: ${reference.title}`}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

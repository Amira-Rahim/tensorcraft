import Link from "next/link";

interface NextLessonProps {
  title: string;
  href: string;
  /** App-level API */
  teaser?: string;
  /** Package-level API */
  moduleTitle?: string;
}

export function NextLesson({
  title,
  href,
  teaser,
  moduleTitle,
}: NextLessonProps) {
  return (
    <Link
      href={href}
      className="group block p-5 my-8 brutalist-shadow bg-surface-raised border border-border transition-all brutalist-hover hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_var(--tc-primary)]"
    >
      <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-muted block mb-2">
        Next Lesson →
      </span>

      <span className="text-lg font-semibold text-text-primary block">
        {title}
      </span>

      {teaser && (
        <span className="text-sm text-text-muted block mt-1">{teaser}</span>
      )}

      {moduleTitle && !teaser && (
        <span className="text-xs text-text-muted block mt-1">
          {moduleTitle}
        </span>
      )}
    </Link>
  );
}

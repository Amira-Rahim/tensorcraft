interface NextLessonProps {
  href: string;
  title: string;
  moduleTitle?: string;
}

export function NextLesson({ href, title, moduleTitle }: NextLessonProps) {
  return (
    <a
      href={href}
      className="group block p-5 my-8 brutalist-shadow bg-surface-raised border border-border transition-all hover:shadow-[6px_6px_0_var(--tc-primary)]"
    >
      <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-text-muted block mb-2">
        Next Lesson
      </span>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-lg font-semibold text-text-primary block truncate">
            {title}
          </span>
          {moduleTitle && (
            <span className="text-xs text-text-muted block mt-1">
              {moduleTitle}
            </span>
          )}
        </div>

        <span className="flex-shrink-0 text-xl text-primary transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </a>
  );
}

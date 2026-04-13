"use client";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-8">
      <div className="border border-border bg-surface p-10 max-w-md w-full">
        <div className="font-mono text-xs text-red-400 tracking-wider uppercase mb-4">
          // ERROR
        </div>
        <h2 className="text-xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
          Lesson failed to load
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          {error.message || "An unexpected error occurred loading this lesson."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 border-2 border-primary bg-primary/10 text-primary font-mono text-sm font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function ModuleOverviewLoading() {
  return (
    <main className="min-h-screen px-6 py-20 bg-surface">
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-4 w-16 bg-border" />
          <span className="text-border">/</span>
          <div className="h-4 w-24 bg-border" />
          <span className="text-border">/</span>
          <div className="h-4 w-32 bg-border" />
        </div>

        {/* Module header skeleton */}
        <div className="mb-10">
          <div className="h-3 w-20 bg-border mb-2" />
          <div className="h-8 w-72 bg-border mb-3" />
          <div className="h-4 w-full max-w-lg bg-border/40" />
        </div>

        {/* Lesson list skeleton */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-5 h-20 bg-surface-raised border border-border"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

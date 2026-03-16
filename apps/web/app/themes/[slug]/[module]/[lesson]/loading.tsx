export default function LessonLoading() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="flex animate-pulse">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-64 border-r border-border p-6 shrink-0">
          <div className="h-4 w-32 bg-border mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 bg-border opacity-50" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-10">
          <div className="h-3 w-48 bg-border mb-6" />
          <div className="h-9 w-96 bg-border mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-border opacity-40"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

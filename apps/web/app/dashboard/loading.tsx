export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-7 w-64 bg-border mb-2" />
          <div className="h-4 w-80 bg-border opacity-50" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 border border-border mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-5 h-20"
              style={{
                borderRight: i < 2 ? "1px solid var(--tc-border)" : "none",
              }}
            />
          ))}
        </div>

        {/* Continue learning skeleton */}
        <div className="mb-10">
          <div className="h-3 w-32 bg-border mb-4" />
          <div className="p-6 h-32 bg-surface-raised border border-border" />
        </div>

        {/* Themes grid skeleton */}
        <div className="h-3 w-24 bg-border mb-4" />
        <div className="grid gap-0.5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 h-28 bg-surface-raised border border-border"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

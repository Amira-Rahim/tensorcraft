export default function ThemeDetailLoading() {
  return (
    <main className="min-h-screen px-6 py-20 bg-surface">
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Back link skeleton */}
        <div className="h-4 w-24 bg-border mb-4" />

        {/* Title skeleton */}
        <div className="h-10 w-64 bg-border mb-2" />
        <div className="h-5 w-48 bg-border/60 mb-2" />
        <div className="h-4 w-full max-w-lg bg-border/40 mb-12" />

        {/* Characters skeleton */}
        <div className="h-4 w-20 bg-border mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-3 h-16 bg-surface-raised border border-border"
            />
          ))}
        </div>

        {/* Modules skeleton */}
        <div className="h-4 w-20 bg-border mb-4" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 h-24 bg-surface-raised border border-border"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

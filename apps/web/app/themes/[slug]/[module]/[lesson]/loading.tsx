export default function LessonLoading() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="w-full max-w-[900px] mx-auto px-6 md:px-12 py-6 animate-pulse">
        {/* Top nav skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-9 w-28 bg-border shrink-0" />
          <div className="flex-1 h-1.5 bg-border" />
          <div className="h-7 w-14 bg-border shrink-0" />
        </div>

        {/* Phase chip skeleton */}
        <div className="h-4 w-24 bg-border mb-6 opacity-50" />

        {/* Title skeleton */}
        <div className="h-9 w-80 max-w-full bg-border mb-8" />

        {/* Content lines skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-border opacity-40"
              style={{ width: `${65 + Math.random() * 35}%` }}
            />
          ))}
        </div>

        {/* Navigation skeleton */}
        <div
          className="flex items-center justify-between mt-10 pt-6"
          style={{
            borderTop: "1px solid var(--tc-border, rgba(255,255,255,0.06))",
          }}
        >
          <div className="h-10 w-24 bg-border" />
          <div className="h-10 w-32 bg-border" />
        </div>
      </div>
    </main>
  );
}

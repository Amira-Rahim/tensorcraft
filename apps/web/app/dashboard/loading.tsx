export default function DashboardLoading() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse">
        {/* Header skeleton */}
        <div className="mb-10">
          <div
            className="h-7 w-64 rounded mb-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-4 w-80 rounded"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
        </div>

        {/* Stats skeleton */}
        <div className="flex gap-4 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[14px] px-5 py-4 flex-1 h-20"
              style={{
                background: "var(--tc-surface, #0F1320)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>

        {/* Continue learning skeleton */}
        <div className="mb-10">
          <div
            className="h-3 w-32 rounded mb-4"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="rounded-[14px] p-6 h-32"
            style={{
              background: "var(--tc-surface, #0F1320)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>

        {/* Themes grid skeleton */}
        <div
          className="h-3 w-24 rounded mb-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[14px] p-5 h-28"
              style={{
                background: "var(--tc-surface, #0F1320)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

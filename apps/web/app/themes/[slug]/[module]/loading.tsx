export default function ModuleOverviewLoading() {
  return (
    <main
      className="min-h-screen px-6 py-20"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className="h-4 w-16 rounded"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <span style={{ color: "rgba(255,255,255,0.1)" }}>/</span>
          <div
            className="h-4 w-24 rounded"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <span style={{ color: "rgba(255,255,255,0.1)" }}>/</span>
          <div
            className="h-4 w-32 rounded"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>

        {/* Module header skeleton */}
        <div className="mb-10">
          <div
            className="h-3 w-20 rounded mb-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-8 w-72 rounded mb-3"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <div
            className="h-4 w-full max-w-lg rounded"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
        </div>

        {/* Lesson list skeleton */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 h-20"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

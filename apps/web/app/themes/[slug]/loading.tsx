export default function ThemeDetailLoading() {
  return (
    <main
      className="min-h-screen px-6 py-20"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-4xl mx-auto animate-pulse">
        {/* Back link skeleton */}
        <div
          className="h-4 w-24 rounded mb-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />

        {/* Title skeleton */}
        <div
          className="h-10 w-64 rounded mb-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-5 w-48 rounded mb-2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-4 w-full max-w-lg rounded mb-12"
          style={{ background: "rgba(255,255,255,0.03)" }}
        />

        {/* Characters skeleton */}
        <div
          className="h-4 w-20 rounded mb-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-3 h-16"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>

        {/* Modules skeleton */}
        <div
          className="h-4 w-20 rounded mb-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 h-24"
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

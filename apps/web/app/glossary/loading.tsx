export default function GlossaryLoading() {
  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-4xl relative z-10 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-[7px] h-[7px] bg-border" />
          <div className="h-3 w-16 bg-border" />
        </div>

        <div className="h-12 w-72 bg-border mb-3" />
        <div className="h-12 w-80 bg-border mb-4" />
        <div className="h-5 w-96 bg-border opacity-50 mb-12" />

        {/* Alphabet nav skeleton */}
        <div className="border border-border bg-surface p-4 mb-12">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 26 }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 border border-border bg-border/20"
              />
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="border-t border-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_100px_1fr_120px] border-b border-border"
            >
              <div className="px-5 py-4">
                <div className="h-4 w-32 bg-border" />
              </div>
              <div className="px-5 py-4">
                <div className="h-3 w-8 bg-border" />
              </div>
              <div className="px-5 py-4">
                <div className="h-4 w-28 bg-border opacity-50" />
              </div>
              <div className="px-5 py-4">
                <div className="h-3 w-16 bg-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

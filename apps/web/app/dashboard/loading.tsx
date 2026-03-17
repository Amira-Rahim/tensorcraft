export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col animate-pulse">
      {/* Ticker skeleton */}
      <div className="h-8 bg-surface-raised border-b border-border" />

      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-75 border-r border-border shrink-0">
          <div className="p-5 border-b border-border flex justify-between">
            <div className="h-3 w-20 bg-border" />
            <div className="h-3 w-10 bg-border" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-4 border-b border-border"
            >
              <div className="w-7 h-7 border border-border" />
              <div className="flex-1">
                <div className="h-2 w-8 bg-border mb-2" />
                <div className="h-3 w-32 bg-border mb-1" />
                <div className="h-2 w-20 bg-border opacity-40" />
              </div>
            </div>
          ))}
        </aside>

        {/* Main skeleton */}
        <main className="flex-1">
          {/* Header */}
          <div className="p-10 border-b border-border flex justify-between items-center">
            <div>
              <div className="h-3 w-40 bg-border mb-3" />
              <div className="h-6 w-72 bg-border mb-2" />
              <div className="h-3 w-48 bg-border opacity-50" />
            </div>
            <div className="h-12 w-44 bg-border" />
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 border-b border-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`p-10 ${i < 2 ? "border-r border-border" : ""}`}
              >
                <div className="h-2 w-24 bg-border mb-3" />
                <div className="h-10 w-28 bg-border mb-2" />
                <div className="h-2 w-20 bg-border opacity-50" />
              </div>
            ))}
          </div>

          {/* Loss curve placeholder */}
          <div className="border-b border-border">
            <div className="p-5 border-b border-border">
              <div className="h-2 w-32 bg-border" />
            </div>
            <div className="h-55" />
          </div>

          {/* Radar + Heatmap */}
          <div className="grid grid-cols-2 border-b border-border">
            <div className="border-r border-border">
              <div className="p-5 border-b border-border">
                <div className="h-2 w-20 bg-border" />
              </div>
              <div className="h-65" />
            </div>
            <div>
              <div className="p-5 border-b border-border">
                <div className="h-2 w-32 bg-border" />
              </div>
              <div className="p-8">
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-surface-overlay border border-border"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

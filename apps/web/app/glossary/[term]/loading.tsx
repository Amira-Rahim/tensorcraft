export default function GlossaryTermLoading() {
  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10 animate-pulse">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-3 w-16 bg-border" />
          <div className="h-3 w-2 bg-border" />
          <div className="h-3 w-28 bg-border" />
        </div>

        <div className="h-5 w-24 border border-border mb-6" />
        <div className="h-10 w-72 bg-border mb-10" />

        {/* Bridge mapping skeleton */}
        <div className="border border-border mb-10">
          <div className="px-6 py-4 border-b border-border">
            <div className="h-3 w-28 bg-border" />
          </div>
          <div className="grid grid-cols-[1fr_40px_1fr] py-6">
            <div className="px-6">
              <div className="h-2 w-16 bg-border mb-3" />
              <div className="h-5 w-32 bg-border" />
            </div>
            <div className="flex items-center justify-center">
              <div className="h-5 w-4 bg-border" />
            </div>
            <div className="px-6">
              <div className="h-2 w-16 bg-border mb-3" />
              <div className="h-5 w-32 bg-border" />
            </div>
          </div>
        </div>

        {/* Tier + Category skeleton */}
        <div className="grid grid-cols-2 border border-border mb-10">
          <div
            className="px-6 py-5"
            style={{ borderRight: "1px solid var(--tc-border)" }}
          >
            <div className="h-2 w-8 bg-border mb-3" />
            <div className="h-4 w-20 bg-border" />
          </div>
          <div className="px-6 py-5">
            <div className="h-2 w-16 bg-border mb-3" />
            <div className="h-4 w-24 bg-border" />
          </div>
        </div>
      </div>
    </main>
  );
}

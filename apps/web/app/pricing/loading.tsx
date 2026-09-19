export default function PricingLoading() {
  return (
    <main
      className="min-h-screen bg-page relative"
      aria-label="Loading pricing"
      aria-busy="true"
    >
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="relative z-10">
        {/* Hero skeleton */}
        <section className="pt-28 pb-16 px-6 text-center">
          <div className="h-4 w-64 max-w-full bg-border motion-safe:animate-pulse mx-auto mb-8" />
          <div className="h-10 w-80 max-w-full bg-border motion-safe:animate-pulse mx-auto mb-5" />
          <div className="h-4 w-96 max-w-full bg-border motion-safe:animate-pulse mx-auto" />
        </section>

        {/* Cards skeleton */}
        <section className="px-6 pb-24">
          <div className="max-w-[1200px] mx-auto grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-7 border border-border bg-surface">
                <div className="h-12 w-20 max-w-full bg-border motion-safe:animate-pulse mb-4" />
                <div className="h-5 w-32 max-w-full bg-border motion-safe:animate-pulse mb-2" />
                <div className="h-3 w-full bg-border motion-safe:animate-pulse mb-6" />
                <div className="space-y-2 mb-7">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-3 w-40 max-w-full bg-border motion-safe:animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-13 w-full bg-border motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

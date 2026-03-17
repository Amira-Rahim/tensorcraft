export default function BlogLoading() {
  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-[7px] h-[7px] bg-border" />
          <div className="h-3 w-12 bg-border" />
        </div>

        <div className="h-12 w-64 bg-border mb-4" />
        <div className="h-5 w-96 bg-border opacity-50 mb-16" />

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-surface p-8">
              <div className="h-3 w-24 bg-border mb-4" />
              <div className="h-5 w-72 bg-border mb-3" />
              <div className="h-3 w-full bg-border opacity-40" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

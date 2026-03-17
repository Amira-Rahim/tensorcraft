export default function PrivacyLoading() {
  return (
    <main className="min-h-screen px-6 py-24 relative">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="max-w-[720px] mx-auto relative z-10">
        <div className="h-3 w-24 bg-border animate-pulse mb-12" />
        <div className="h-9 w-48 bg-border animate-pulse mb-2" />
        <div className="h-3 w-40 bg-border animate-pulse mb-12" />
        <div className="space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-5 w-56 bg-border animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-border animate-pulse" />
                <div className="h-3 w-5/6 bg-border animate-pulse" />
                <div className="h-3 w-4/6 bg-border animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function BlogPostLoading() {
  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10 animate-pulse">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-3 w-10 bg-border" />
          <div className="h-3 w-2 bg-border" />
          <div className="h-3 w-32 bg-border" />
        </div>

        <div className="h-3 w-20 bg-border mb-6" />
        <div className="h-10 w-96 bg-border mb-4" />
        <div className="h-4 w-80 bg-border opacity-50 mb-10" />

        <div className="space-y-4">
          <div className="h-4 w-full bg-border opacity-30" />
          <div className="h-4 w-full bg-border opacity-30" />
          <div className="h-4 w-3/4 bg-border opacity-30" />
          <div className="h-8 w-full" />
          <div className="h-4 w-full bg-border opacity-30" />
          <div className="h-4 w-5/6 bg-border opacity-30" />
        </div>
      </div>
    </main>
  );
}

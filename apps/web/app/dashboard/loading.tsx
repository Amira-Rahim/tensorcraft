export default function DashboardLoading() {
  return (
    <main
      aria-label="Loading dashboard"
      aria-busy="true"
      className="mx-auto w-full max-w-270 px-5 py-7 sm:px-12 motion-safe:animate-pulse"
    >
      <div className="h-5 w-40 bg-surface-overlay mb-6" />
      <div className="bg-surface-raised p-8">
        <div className="h-8 w-full max-w-100 bg-surface-overlay mb-4" />
        <div className="h-4 w-full max-w-70 bg-surface-overlay mb-8" />
        <div className="h-11 w-44 bg-surface-overlay" />
      </div>
      <div className="py-8">
        <div className="h-5 w-32 bg-surface-overlay mb-5" />
        <div className="h-2 w-full bg-surface-overlay" />
      </div>
    </main>
  );
}

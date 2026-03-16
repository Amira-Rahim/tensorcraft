export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-12 animate-pulse">
        <div className="h-7 w-40 bg-border mb-2" />
        <div className="h-4 w-64 bg-border opacity-50 mb-10" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-surface-raised border border-border"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

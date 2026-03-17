export default function SignUpLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="w-full max-w-md relative z-10">
        <div className="h-8 w-40 bg-border animate-pulse mx-auto mb-2" />
        <div className="h-4 w-56 bg-border animate-pulse mx-auto mb-8" />
        <div className="space-y-4">
          <div className="h-11 w-full bg-border animate-pulse" />
          <div className="h-11 w-full bg-border animate-pulse" />
          <div className="h-px w-full bg-border my-4" />
          <div className="h-4 w-20 bg-border animate-pulse mb-1" />
          <div className="h-11 w-full bg-border animate-pulse" />
          <div className="h-4 w-20 bg-border animate-pulse mb-1" />
          <div className="h-11 w-full bg-border animate-pulse" />
          <div className="h-11 w-full bg-border animate-pulse mt-4" />
        </div>
      </div>
    </main>
  );
}

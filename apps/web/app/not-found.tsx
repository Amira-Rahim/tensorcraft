import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-6xl font-bold font-mono mb-4 text-primary opacity-30">
          404
        </p>

        <h1 className="text-2xl font-semibold font-mono mb-3 text-text-primary">
          Page not found
        </h1>

        <p className="text-base mb-8 text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-sm font-medium font-mono bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
          >
            Go to dashboard
          </Link>

          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 text-sm font-medium font-mono border border-border text-text-muted hover:text-text-primary hover:border-primary/30 transition-all brutalist-hover"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

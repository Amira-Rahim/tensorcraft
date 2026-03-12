import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p
          className="text-6xl font-bold mb-4"
          style={{ color: "#00D4FF", opacity: 0.3 }}
        >
          404
        </p>

        <h1
          className="text-2xl font-semibold mb-3"
          style={{ color: "#FFFFFF" }}
        >
          Page not found
        </h1>

        <p className="text-base mb-8" style={{ color: "#8B92A5" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#00D4FF",
              color: "#080B16",
              borderRadius: "999px",
              border: "none",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Go to dashboard
          </Link>

          <Link
            href="/"
            className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "transparent",
              color: "#8B92A5",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

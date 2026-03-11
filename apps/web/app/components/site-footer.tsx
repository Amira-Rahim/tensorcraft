import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
        <div className="font-semibold text-text-primary tracking-wide">
          &#9671; tensorcraft
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <Link
            href="/terms"
            className="hover:text-text-primary transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="hover:text-text-primary transition-colors"
          >
            Privacy
          </Link>
        </div>
        <div>&copy; 2026 Tensorcraft. All rights reserved.</div>
      </div>
    </footer>
  );
}

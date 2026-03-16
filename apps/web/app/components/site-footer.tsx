import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-8 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted font-mono">
          <div className="flex items-center gap-2 font-bold text-text-primary tracking-wider text-xs">
            <span className="bg-primary text-surface px-1.5 py-0.5 text-[9px] font-bold">
              T_
            </span>
            TENSORCRAFT
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/themes"
              className="text-[10px] hover:text-text-primary transition-colors"
            >
              Themes
            </Link>
            <Link
              href="/pricing"
              className="text-[10px] hover:text-text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="text-[10px] hover:text-text-primary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/glossary"
              className="text-[10px] hover:text-text-primary transition-colors"
            >
              Glossary
            </Link>
            <Link
              href="/terms"
              className="text-[10px] hover:text-text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[10px] hover:text-text-primary transition-colors"
            >
              Privacy
            </Link>
          </div>
          <div className="font-mono text-[10px]">&copy; 2026 Tensorcraft</div>
        </div>
      </div>
    </footer>
  );
}

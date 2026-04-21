import Link from "next/link";

const FOOTER_LINK_CLASS =
  "inline-flex items-center min-h-11 font-mono text-xs rounded-none hover:text-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2";

export function SiteFooter() {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-border px-8 py-8 rounded-none"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted font-mono">
          <div className="flex items-center gap-2 font-bold text-text-primary tracking-wider text-xs">
            <span
              data-testid="footer-logo-badge"
              className="flex items-center justify-center w-7 h-7 border border-primary bg-primary text-page font-mono text-[13px] font-bold rounded-none"
            >
              T_
            </span>
            TENSORCRAFT
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/themes" className={FOOTER_LINK_CLASS}>
              Themes
            </Link>
            <Link href="/pricing" className={FOOTER_LINK_CLASS}>
              Pricing
            </Link>
            <Link href="/blog" className={FOOTER_LINK_CLASS}>
              Blog
            </Link>
            <Link href="/learn" className={FOOTER_LINK_CLASS}>
              Learn
            </Link>
            <Link href="/glossary" className={FOOTER_LINK_CLASS}>
              Glossary
            </Link>
            <Link href="/terms" className={FOOTER_LINK_CLASS}>
              Terms
            </Link>
            <Link href="/privacy" className={FOOTER_LINK_CLASS}>
              Privacy
            </Link>
          </div>
          <div className="font-mono text-xs">&copy; 2026 Tensorcraft</div>
        </div>
      </div>
    </footer>
  );
}

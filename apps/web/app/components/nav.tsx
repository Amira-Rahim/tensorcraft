import Link from "next/link";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 h-[72px] flex items-center justify-between px-8 bg-surface/80 backdrop-blur-[20px] border-b border-border">
      <Link href="/" className="text-lg font-semibold tracking-wide">
        &#9671; tensorcraft
      </Link>

      <div className="hidden md:flex items-center border border-white/8 rounded-full p-1">
        <Link
          href="#themes"
          className="px-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-full transition-colors"
        >
          Themes
        </Link>
        <Link
          href="/pricing"
          className="px-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-full transition-colors"
        >
          Pricing
        </Link>
      </div>

      <Link
        href="/auth/sign-in"
        className="inline-flex items-center rounded-full border border-white/15 bg-transparent px-6 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
      >
        Start now &rarr;
      </Link>
    </nav>
  );
}

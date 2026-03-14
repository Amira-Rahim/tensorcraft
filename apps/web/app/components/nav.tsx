import Link from "next/link";
import { UserMenu } from "./user-menu";

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 h-15 flex items-center justify-between px-8 bg-surface border-b border-border"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 font-mono text-sm font-medium tracking-wider text-text-primary"
      >
        <span className="bg-primary text-surface px-1.5 py-0.5 text-[10px] font-bold">
          T_
        </span>
        TENSORCRAFT
      </Link>

      <div className="hidden md:flex items-center gap-7 font-mono">
        <Link
          href="/themes"
          className="text-[13px] text-text-muted hover:text-text-primary transition-colors"
        >
          Themes
        </Link>
        <Link
          href="/bridges"
          className="text-[13px] text-text-muted hover:text-text-primary transition-colors"
        >
          Bridges
        </Link>
        <Link
          href="/pricing"
          className="text-[13px] text-text-muted hover:text-text-primary transition-colors"
        >
          Pricing
        </Link>
      </div>

      <UserMenu />
    </nav>
  );
}

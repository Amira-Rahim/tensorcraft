"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/themes", label: "THEMES" },
  { href: "/pricing", label: "PRICING" },
  { href: "/learn", label: "LEARN" },
  { href: "/blog", label: "BLOG" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Check auth state
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex flex-col justify-center items-center gap-[5px] w-11 h-11 border border-border bg-surface hover:bg-surface-raised transition-colors"
      >
        <span className="block w-5 h-[2px] bg-text-primary" />
        <span className="block w-5 h-[2px] bg-text-primary" />
        <span className="block w-5 h-[2px] bg-text-primary" />
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-page flex flex-col">
          {/* Header row */}
          <div className="flex items-center justify-between h-15 px-8 border-b border-border">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 font-mono text-sm font-medium tracking-wider text-text-primary"
            >
              <span className="bg-primary text-page px-1.5 py-0.5 text-xs font-bold">
                T_
              </span>
              TENSORCRAFT
            </Link>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex items-center justify-center w-11 h-11 border border-border bg-surface hover:bg-surface-raised transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="text-text-primary"
              >
                <path
                  d="M1 1L17 17M17 1L1 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 flex flex-col justify-center px-8 gap-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block py-4 text-xl font-mono font-medium tracking-wider uppercase border-b border-border transition-colors ${
                  pathname === href
                    ? "text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Bottom section — auth-aware */}
          <div className="px-8 pb-10 border-t border-border pt-6">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`block w-full text-center px-6 py-3.5 text-sm font-mono font-medium uppercase tracking-wider transition-all border ${
                    pathname === "/dashboard"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-muted hover:border-primary/30 hover:text-text-primary"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/inbox"
                  onClick={() => setOpen(false)}
                  className={`block w-full text-center px-6 py-3.5 text-sm font-mono font-medium uppercase tracking-wider transition-all border ${
                    pathname.startsWith("/inbox")
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-muted hover:border-primary/30 hover:text-text-primary"
                  }`}
                >
                  Inbox
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={`block w-full text-center px-6 py-3.5 text-sm font-mono font-medium uppercase tracking-wider transition-all border ${
                    pathname === "/settings"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-muted hover:border-primary/30 hover:text-text-primary"
                  }`}
                >
                  Settings
                </Link>
                <div className="font-mono text-xs text-text-muted text-center mt-2 truncate">
                  {user.email}
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="block w-full text-center border border-primary/30 bg-primary/8 px-6 py-3.5 text-sm font-mono font-medium uppercase tracking-wider hover:bg-primary/15 hover:border-primary/50 transition-all"
              >
                Start now &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

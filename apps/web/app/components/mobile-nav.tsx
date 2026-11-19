"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FocusTrap } from "@tensorcraft/ui/a11y";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/worlds", label: "WORLDS" },
  { href: "/pricing", label: "PRICING" },
  { href: "/guides", label: "Guides" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const pathname = usePathname();
  const learningNavigation = !!user || pathname.startsWith("/dashboard");
  const links = learningNavigation
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/progress", label: "Progress" },
        { href: "/dashboard/project", label: "Project" },
        { href: "/worlds", label: "Worlds" },
      ]
    : NAV_LINKS;

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

      {/* Full-screen overlay.
          It covers the page but did not constrain focus: Tab walked straight
          out of the menu and into the page behind it, which is still rendered
          underneath, and Escape did nothing. A keyboard or screen reader user
          could be "in" a menu that visually owns the whole viewport while
          operating links they cannot see. FocusTrap (packages/ui/src/a11y) was
          already solving exactly this for the lesson drawer. */}
      {open && (
        <FocusTrap active={open} onEscape={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-x-0 top-0 bottom-[var(--tc-consent-h,0px)] z-50 bg-page flex flex-col overflow-y-auto"
          >
            {/* Header row */}
            <div className="flex flex-wrap shrink-0 items-center justify-between min-h-15 py-1 px-[min(2rem,5vw)] border-b border-border">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 font-mono text-sm font-medium tracking-wider text-text-primary"
              >
                <span className="bg-primary text-on-primary px-1.5 py-0.5 text-xs font-bold">
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
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block py-4 text-xl font-medium border-b border-border transition-colors ${
                    pathname === href
                      ? "text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Bottom section, auth-aware */}
            <div className="px-8 pb-10 border-t border-border pt-6">
              {user ? (
                <div className="flex flex-col gap-2">
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
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="min-h-11 py-3 text-center text-sm underline"
                  >
                    Access and pricing
                  </Link>
                  <Link
                    href="/guides"
                    onClick={() => setOpen(false)}
                    className="min-h-11 py-3 text-center text-sm underline"
                  >
                    Guides
                  </Link>
                  {/* ph-no-capture: identity text stays out of PostHog
                      autocapture and session replays. */}
                  <div className="font-mono text-xs text-text-muted text-center mt-2 truncate ph-no-capture">
                    {user.email}
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center border border-primary/30 bg-primary/8 px-6 py-3.5 text-sm font-mono font-medium uppercase tracking-wider hover:bg-primary/15 hover:border-primary/50 transition-all"
                >
                  Start now
                </Link>
              )}
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
}

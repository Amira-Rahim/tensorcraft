"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { SchemeToggle } from "./scheme-toggle";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`inline-flex items-center min-h-11 font-mono text-[13px] tracking-wider uppercase rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
        isActive
          ? "text-primary font-semibold"
          : "text-text-muted hover:text-text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // DISPATCH messages arrive silently server-side; without a badge the
  // narrative reward system depends on habitual checking (2026-07-14 UX
  // audit). Refetch on route change so reading mail clears the dot.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase
      .rpc("count_unread_dispatch")
      .then(({ data }) => setUnreadCount(typeof data === "number" ? data : 0));
  }, [isAuthenticated, pathname]);

  // Focus mode: lesson viewer routes get no marketing nav. Lesson routes are
  // exactly /worlds/{slug}/{module}/{lesson}; the capstone page is 3 segments
  // (/worlds/{slug}/capstone) so it never matches; the endsWith guard is
  // only defensive against a lesson slug literally named "capstone".
  const isLessonRoute =
    /^\/worlds\/[^/]+\/[^/]+\/[^/]+$/.test(pathname) &&
    !pathname.endsWith("/capstone");
  if (isLessonRoute) return null;

  return (
    <nav
      data-testid="site-nav"
      className="sticky top-0 z-50 h-15 flex items-center justify-between px-8 bg-surface border-b border-border rounded-none"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 font-mono text-sm font-medium tracking-wider text-text-primary rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        <span
          data-testid="nav-logo-badge"
          className="flex items-center justify-center w-7 h-7 border border-primary bg-primary text-on-primary font-mono text-[13px] font-bold rounded-none"
        >
          T_
        </span>
        TENSORCRAFT
      </Link>

      <div className="hidden md:flex items-center gap-6 font-mono">
        {isAuthenticated && <NavLink href="/dashboard">Dashboard</NavLink>}
        {/* Restored 2026-07-13: the milestone producer
            (apps/api/src/lib/dispatch.ts) now writes module/world-clear
            messages, so the inbox is no longer guaranteed-empty. */}
        {isAuthenticated && (
          <NavLink href="/inbox">
            Inbox
            {unreadCount > 0 && (
              <span
                data-testid="inbox-unread-badge"
                className="ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 bg-primary text-on-primary text-[10px] font-bold rounded-none"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount}
              </span>
            )}
          </NavLink>
        )}
        <NavLink href="/worlds">Worlds</NavLink>
        <NavLink href="/journey">Journey</NavLink>
        <NavLink href="/pricing">Pricing</NavLink>
        <NavLink href="/learn">Learn</NavLink>
        <NavLink href="/blog">Blog</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <SchemeToggle />
        <div className="hidden md:block">
          <UserMenu />
        </div>
        <MobileNav />
      </div>
    </nav>
  );
}

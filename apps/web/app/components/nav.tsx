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
  const isActive =
    href === "/" || href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`inline-flex items-center min-h-11 text-sm rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
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

  // Focus mode: lesson viewer routes get no marketing nav. Lesson routes are
  // exactly /worlds/{slug}/{module}/{lesson}; the capstone page is 3 segments
  // (/worlds/{slug}/capstone) so it never matches; the endsWith guard is
  // only defensive against a lesson slug literally named "capstone".
  const isLessonRoute =
    /^\/worlds\/[^/]+\/[^/]+\/[^/]+$/.test(pathname) &&
    !pathname.endsWith("/capstone");
  if (
    isLessonRoute ||
    (process.env.NODE_ENV === "development" &&
      [
        "/design/deep-orbit",
        "/design/purchase-success",
        "/design/purchase-email",
      ].includes(pathname))
  )
    return null;
  const learningNavigation =
    isAuthenticated || pathname.startsWith("/dashboard");

  return (
    <nav
      data-testid="site-nav"
      className="sticky top-0 z-50 min-h-15 py-1 flex flex-wrap items-center justify-between px-[min(2rem,5vw)] bg-surface border-b border-border rounded-none"
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
        {learningNavigation && (
          <>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/progress">Progress</NavLink>
            <NavLink href="/dashboard/project">Project</NavLink>
          </>
        )}
        <NavLink href="/worlds">Worlds</NavLink>
        {!learningNavigation && (
          <>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/blog">Blog</NavLink>
          </>
        )}
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

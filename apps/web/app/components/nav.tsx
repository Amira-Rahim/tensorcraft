"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

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
      className={`text-[13px] transition-colors ${
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
        {isAuthenticated && <NavLink href="/dashboard">Dashboard</NavLink>}
        <NavLink href="/themes">Themes</NavLink>
        <NavLink href="/pricing">Pricing</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <UserMenu />
        </div>
        <MobileNav />
      </div>
    </nav>
  );
}

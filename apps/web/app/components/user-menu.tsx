"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Initial user fetch
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for auth changes — SessionListener handles TOKEN_REFRESHED and
    // SIGNED_OUT routing, so we only need this for updating local user state.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center border border-primary/30 bg-primary/8 px-6 py-2.5 text-sm font-mono font-medium hover:bg-primary/15 hover:border-primary/50 transition-all brutalist-hover"
      >
        Start now &rarr;
      </Link>
    );
  }

  const initial = (user.user_metadata?.display_name || user.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
        className="w-9 h-9 flex items-center justify-center text-sm font-mono font-bold border border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-56 border border-border overflow-hidden brutalist-shadow z-50 bg-surface-raised"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-mono truncate text-text-muted">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-mono text-text-primary transition-colors hover:bg-surface-raised"
              role="menuitem"
            >
              Settings
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-mono text-left text-text-muted transition-colors hover:bg-surface-raised"
              role="menuitem"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

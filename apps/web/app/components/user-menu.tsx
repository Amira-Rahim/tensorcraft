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

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

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
        href="/auth/sign-in"
        className="inline-flex items-center rounded-full border border-white/15 bg-transparent px-6 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
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
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors hover:ring-1 hover:ring-white/20"
        style={{
          background: "rgba(0,212,255,0.15)",
          color: "var(--tc-accent, #00D4FF)",
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-56 rounded-xl border border-border overflow-hidden shadow-2xl z-50"
          style={{ background: "var(--tc-surface, #0F1320)" }}
          role="menu"
        >
          <div className="px-4 py-3 border-b border-border">
            <p
              className="text-xs truncate"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
              style={{ color: "var(--tc-text, #FFFFFF)" }}
              role="menuitem"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
              style={{ color: "var(--tc-text, #FFFFFF)" }}
              role="menuitem"
            >
              Settings
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/[0.04]"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
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

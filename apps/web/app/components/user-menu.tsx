"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UserAvatar } from "./user-avatar";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Initial user fetch
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("profiles")
          .select("avatar_url, display_name")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            setAvatarUrl(profile?.avatar_url ?? null);
            setDisplayName(profile?.display_name ?? null);
          });
      }
    });

    // Listen for auth changes, SessionListener handles TOKEN_REFRESHED and
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
    // Already on the auth page: the CTA would just reload it, so hide it.
    if (pathname === "/auth") return null;
    return (
      <Link
        href="/auth"
        className="inline-flex items-center justify-center min-h-11 border border-primary/30 bg-primary/8 px-6 py-2.5 text-sm font-mono font-medium rounded-none hover:bg-primary/15 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all brutalist-hover"
      >
        Start now
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
        className="w-11 h-11 flex items-center justify-center border border-primary/30 bg-primary/10 text-primary rounded-none transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 overflow-hidden"
      >
        {/* The name only feeds the initial here. decorative keeps it out of
            every attribute: the button is already labelled, and autocapture
            used to record the email from the avatar's aria-label. */}
        <UserAvatar
          url={avatarUrl}
          name={displayName || user.email || "U"}
          size={32}
          decorative
        />
      </button>

      {open && (
        <div
          data-testid="user-menu-card"
          className="absolute right-0 top-12 w-56 border border-border overflow-hidden rounded-none brutalist-shadow z-50 bg-surface-raised"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-border">
            {/* ph-no-capture: identity text stays out of PostHog
                autocapture and session replays. */}
            <p className="text-xs font-mono truncate text-text-muted ph-no-capture">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            {[
              { href: "/pricing", label: "Access and pricing" },
              { href: "/blog", label: "Blog" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex min-h-11 items-center px-4 py-2.5 text-sm text-text-primary hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 min-h-11 px-4 py-2.5 text-sm font-mono text-text-primary rounded-none transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              role="menuitem"
            >
              Settings
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full min-h-11 px-4 py-2.5 text-sm font-mono text-left text-text-muted rounded-none transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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

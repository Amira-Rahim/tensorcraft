"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getApiUrl } from "@/lib/api-url";

export function CapstoneEmailTag({ themeSlug }: { themeSlug: string }) {
  useEffect(() => {
    const key = `tc_capstone_tagged_${themeSlug}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ event: "capstone" }),
      }).catch(() => {});
    });
  }, [themeSlug]);

  return null;
}

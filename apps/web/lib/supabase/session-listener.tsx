"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "./client";

/**
 * Persists the GitHub OAuth provider_token to the profiles table.
 * Supabase only exposes this token at sign-in time; it is not stored
 * in identity_data and cannot be retrieved later. We capture it here
 * and write it to profiles.github_token so the API can use it.
 */
async function persistProviderToken(
  providerToken: string,
  accessToken: string,
) {
  const { getApiUrl } = await import("../api-url");
  const apiUrl = getApiUrl();

  try {
    await fetch(`${apiUrl}/api/github/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ github_token: providerToken }),
    });
  } catch (err) {
    console.error("Failed to persist GitHub provider token:", err);
  }
}

export function SessionListener() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        router.push("/auth");
      }

      // Capture the GitHub provider token at sign-in and persist it.
      // session.provider_token is only available during SIGNED_IN events
      // triggered by an OAuth flow; it is null on subsequent page loads.
      if (
        event === "SIGNED_IN" &&
        session?.provider_token &&
        session.access_token
      ) {
        persistProviderToken(session.provider_token, session.access_token);
      }

      // Tag new signups in Kit (fire once per browser)
      if (event === "SIGNED_IN" && session?.access_token) {
        try {
          if (!localStorage.getItem("tc_signup_tagged")) {
            localStorage.setItem("tc_signup_tagged", "1");
            import("../api-url").then(({ getApiUrl }) => {
              const apiUrl = getApiUrl();
              fetch(`${apiUrl}/api/email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ event: "signed_up" }),
              }).catch(() => {});
            });
          }
        } catch {
          // localStorage unavailable
        }

        // Identify user in PostHog for analytics
        import("../analytics").then(({ identify }) => {
          if (session.user) {
            identify(session.user.id, {
              email: session.user.email,
              created_at: session.user.created_at,
            });
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}

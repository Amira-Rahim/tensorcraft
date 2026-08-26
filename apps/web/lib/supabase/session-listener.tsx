"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "./client";
import { hasAnalyticsConsent, onConsentChange } from "../consent";
import { identify, reset } from "../analytics";

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
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    function identifyUser(user: { id: string; created_at: string }) {
      if (!hasAnalyticsConsent()) return;
      if (identifiedUserId.current && identifiedUserId.current !== user.id) {
        reset();
      }
      identify(user.id, { created_at: user.created_at });
      identifiedUserId.current = user.id;
    }

    function identifyCurrentUser() {
      if (!hasAnalyticsConsent()) return;

      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        identifyUser(user);
      });
    }

    // Covers a page refresh for an already authenticated user. The consent
    // subscription also retries when analytics is enabled after this listener
    // first receives Supabase's INITIAL_SESSION event.
    const unsubscribeConsent = onConsentChange(identifyCurrentUser);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") {
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        identifiedUserId.current = null;
        reset();
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

      // Tag new signups in Kit (fire once per browser). Dedupe correctness
      // lives in tagKitEventOnce: the flag is recorded only when Kit actually
      // tagged someone, never on a pass that tagged nobody.
      if (event === "SIGNED_IN" && session?.access_token) {
        void import("../kit-tag").then(({ tagKitEventOnce }) =>
          tagKitEventOnce("signed_up", "tc_signup_tagged").catch(() => {}),
        );

        // signup_completed closes the funnel opened by signup_started in
        // auth-form. Without it the conversion rate is uncomputable - the
        // KPI formulas in docs/tech-spec.md divide by exactly this event,
        // and it is the step paid distribution spend is judged on. Fired
        // here rather than in /auth/callback because that is a server route
        // with no analytics client.
        void import("../analytics-events").then(({ EVENTS, track }) =>
          track(EVENTS.SIGNUP_COMPLETED, {
            method: session.user?.app_metadata?.provider ?? "unknown",
          }),
        );

        // Identify with the Supabase UUID. Email is deliberately person-only
        // data and is not sent with product events.
        identifyUser(session.user);
      }
    });

    return () => {
      unsubscribeConsent();
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}

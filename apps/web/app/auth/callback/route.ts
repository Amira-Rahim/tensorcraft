import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback: exchangeCodeForSession failed", error);
      // Forward to Sentry — auth callback is a critical path; silent failures
      // here mean users see only "auth_callback_error" with no trail in
      // production. Sentry no-ops if DSN is unset.
      Sentry.captureException(error, {
        tags: { route: "auth/callback" },
      });
    }

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const allowedHosts = ["tensorcraft.app", "www.tensorcraft.app"];

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost && allowedHosts.includes(forwardedHost)) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth error — redirect to sign in with error
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`);
}

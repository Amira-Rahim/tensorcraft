import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      "Supabase env vars not set, skipping auth middleware. See apps/web/.env.example",
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session, this keeps the auth token alive
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const protectedRoutes = ["/dashboard", "/settings", "/onboarding"];
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // If session refresh fails, clear stale cookies and treat as unauthenticated
  if (authError && !user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      url.searchParams.set("error", "session_expired");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ["/auth/sign-in", "/auth/sign-up", "/auth"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isAuthRoute && user) {
    const rawRedirectTo =
      request.nextUrl.searchParams.get("redirectTo") || "/dashboard";
    const redirectTo =
      rawRedirectTo.startsWith("/") && !rawRedirectTo.startsWith("//")
        ? rawRedirectTo
        : "/dashboard";
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Redirect to onboarding if user hasn't completed it (only on protected routes
  // to avoid a DB query on every single page load like landing, pricing, blog, etc.)
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");

    // Incomplete onboarding → force to /onboarding (unless already there)
    if (profile && !profile.onboarding_completed && !isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Completed onboarding → block re-entry to /onboarding
    if (profile && profile.onboarding_completed && isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

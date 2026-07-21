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

  // Refresh the session, this keeps the auth token alive.
  //
  // Wrapped because `getUser()` is a NETWORK call to GoTrue and this runs on
  // essentially every request. Unwrapped, any Supabase Auth slowness or
  // outage threw here and took down the whole site — including the fully
  // static landing page, which needs no auth at all. A throw in middleware is
  // a 500 for the request, so an auth incident became a total outage.
  //
  // Failing open is correct: an auth failure means "we could not establish
  // who this is", which is exactly the unauthenticated state. Protected
  // routes below still redirect to /auth, so nothing privileged leaks; public
  // pages keep serving.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  let authError: unknown = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    authError = result.error;
  } catch (err) {
    authError = err;
  }

  const protectedRoutes = ["/dashboard", "/settings", "/onboarding"];
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // Destination to round-trip through /auth. Must include the query string:
  // checkout builds /pricing?plan=...&themes=... and losing the query used
  // to strand buyers (2026-07-19 UX audit).
  const requestedPath = request.nextUrl.pathname + request.nextUrl.search;

  // If session refresh fails, clear stale cookies and treat as unauthenticated
  if (authError && !user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.search = "";
      url.searchParams.set("redirectTo", requestedPath);
      // Only claim the session EXPIRED when there was a session to expire.
      // `authError && !user` also covers a cookieless first visit, so a
      // brand-new visitor clicking a /dashboard link was told their session
      // had expired — confusing, and it frames a normal signup as a fault.
      // Presence of a Supabase auth cookie is the distinguishing signal.
      const hadSession = request.cookies
        .getAll()
        .some((c) => c.name.startsWith("sb-"));
      if (hadSession) {
        url.searchParams.set("error", "session_expired");
      }
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("redirectTo", requestedPath);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth PAGES. Exact match only:
  // a startsWith("/auth") check used to swallow /auth/callback (magic-link
  // clicks by signed-in users lost their `next` destination) and
  // /auth/sign-out.
  const authPages = ["/auth", "/auth/sign-in", "/auth/sign-up"];
  const isAuthPage = authPages.includes(request.nextUrl.pathname);

  if (isAuthPage && user) {
    const rawRedirectTo =
      request.nextUrl.searchParams.get("redirectTo") || "/dashboard";
    // Same-origin only: single leading "/", not "//" or "/\" (browsers
    // normalize "\" to "/", making "/\evil.com" protocol-relative), and no
    // control characters. Mirrors the onboarding wizard's guard.
    const isSafe =
      rawRedirectTo.startsWith("/") &&
      !rawRedirectTo.startsWith("//") &&
      !rawRedirectTo.startsWith("/\\") &&
      // eslint-disable-next-line no-control-regex
      !/[\u0000-\u001f]/.test(rawRedirectTo);
    const destination = isSafe ? rawRedirectTo : "/dashboard";
    // Parse via URL so a query string in the destination stays a query
    // string; assigning it to url.pathname percent-encoded the "?" and 404'd.
    return NextResponse.redirect(new URL(destination, request.url));
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

    // Incomplete onboarding → force to /onboarding (unless already there).
    // Carry the requested destination along: the wizard used to exit every
    // learner to /themes/deep-orbit regardless of what they asked for
    // (2026-07-14 UX audit).
    if (profile && !profile.onboarding_completed && !isOnboarding) {
      const url = request.nextUrl.clone();
      const requested = url.pathname + url.search;
      url.pathname = "/onboarding";
      url.search = `?redirectTo=${encodeURIComponent(requested)}`;
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

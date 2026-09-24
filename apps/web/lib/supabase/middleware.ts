import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Reads a single claim from an already-validated access token WITHOUT a network
 * call. getUser() (in updateSession) is what AUTHENTICATES the request; this
 * only decodes the payload of that same token to read a non-security-critical
 * flag (onboarding gating). Returns undefined if the token is absent/opaque or
 * the claim is missing - callers then fall back to a profiles read, so gating
 * stays correct for tokens minted before the custom-access-token hook
 * (migration 046) was enabled.
 */
function readTokenClaim(
  accessToken: string | undefined,
  claim: string,
): unknown {
  if (!accessToken) return undefined;
  const payload = accessToken.split(".")[1];
  if (!payload) return undefined;
  try {
    // JWT payloads are base64url and unpadded; atob wants standard base64 with
    // padding, so translate -_ → +/ and re-pad to a multiple of 4.
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    b64 = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const json = atob(b64);
    return (JSON.parse(json) as Record<string, unknown>)[claim];
  } catch {
    return undefined;
  }
}

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
  // outage threw here and took down the whole site - including the fully
  // static landing page, which needs no auth at all. A throw in middleware is
  // a 500 for the request, so an auth incident became a total outage.
  //
  // Failing open is correct: an auth failure means "we could not establish
  // who this is", which is exactly the unauthenticated state. Protected
  // routes below still redirect to /auth, so nothing privileged leaks; public
  // pages keep serving.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  let authError: unknown;
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
  // checkout builds /pricing?plan=...&worlds=... and losing the query used
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
      // had expired - confusing, and it frames a normal signup as a fault.
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
    const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");

    // Prefer the `onboarding_completed` claim injected into the JWT by the
    // custom access token hook (migration 046) - reading it off the already-
    // validated token costs no DB round-trip on this hot authed path.
    // getSession() reads the cookie (no network); we only decode the token for
    // this non-security-critical flag, identity still comes from getUser above.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const claim = readTokenClaim(session?.access_token, "onboarding_completed");

    // Fall back to a profiles read only when the claim is absent - tokens
    // minted before the hook was enabled, or if the hook is not yet configured.
    // This keeps gating correct in every state; the read simply disappears once
    // tokens carry the claim.
    let onboardingCompleted = typeof claim === "boolean" ? claim : undefined;
    if (onboardingCompleted === undefined) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      if (profile) onboardingCompleted = profile.onboarding_completed;
    }

    // Incomplete onboarding → force to /onboarding (unless already there).
    // Carry the requested destination along: the wizard used to exit every
    // learner to /worlds/deep-orbit regardless of what they asked for
    // (2026-07-14 UX audit).
    if (onboardingCompleted === false && !isOnboarding) {
      const url = request.nextUrl.clone();
      const requested = url.pathname + url.search;
      url.pathname = "/onboarding";
      url.search = `?redirectTo=${encodeURIComponent(requested)}`;
      return NextResponse.redirect(url);
    }

    // Completed onboarding → block re-entry to /onboarding
    if (onboardingCompleted === true && isOnboarding) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

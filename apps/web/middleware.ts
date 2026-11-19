import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Set tc_world cookie when visiting a world page
  const worldMatch = request.nextUrl.pathname.match(/^\/worlds\/([^/]+)/);
  if (worldMatch) {
    response.cookies.set("tc_world", worldMatch[1], {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static assets.
    //
    // The exclusion list previously stopped at _next and image extensions, so
    // EVERYTHING under public/ still ran this middleware - and the middleware
    // makes a network `auth.getUser()` call to GoTrue. Every fetch of
    // `/vendor/tfjs-4.22.0.min.js` (1.4 MB, pulled on each lesson exercise),
    // every weights.bin under `/models`, and every robots.txt hit therefore
    // cost one edge invocation AND one Supabase Auth request, to establish a
    // session nobody would use. That bills two metered services for nothing,
    // and Supabase REST volume is the documented bottleneck.
    //
    // Excluded: _next internals, favicon, the public/ asset types (images,
    // fonts, and the js/mjs/json/bin/wasm the exercise runner and demos fetch),
    // and the crawler files robots.txt + sitemap.xml - route handlers, but
    // public by definition and no use for a session.
    //
    // Also excluded (gap sweep F4, 2026-07-25): /api/og - every social
    // scraper's card fetch was paying an edge invocation + a GoTrue call
    // for an image that is public by definition - and the RFC 8058
    // one-click unsubscribe POST, which authenticates by unguessable token,
    // not session.
    //
    // Still matched: every HTML page route, which is where auth matters.
    "/((?!_next/static|_next/image|favicon.ico|vendor/|models/|api/og|unsubscribe/one-click|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|js|mjs|json|bin|wasm|txt|xml)$).*)",
  ],
};

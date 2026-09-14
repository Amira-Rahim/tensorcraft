import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

// Not named __dirname: Next evaluates this file through the CommonJS wrapper,
// whose parameters include __dirname. See app/next-config.test.ts.
const configDir = path.dirname(fileURLToPath(import.meta.url));
const velitePath = path.resolve(configDir, "../../packages/content/.velite");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tensorcraft/ui",
    "@tensorcraft/worlds",
    "@tensorcraft/supabase",
    "@tensorcraft/content",
    "@tensorcraft/shared",
  ],
  // Phase 6c: image optimization. AVIF/WebP auto-selection via next/image;
  // remotePatterns lists CDNs we pull avatars / content imagery from.
  // Supabase storage host derives from NEXT_PUBLIC_SUPABASE_URL so we can't
  // hardcode it, configure via env at deploy time if Supabase-hosted media
  // is added. For now, only same-origin + explicit trusted sources.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  webpack: (config) => {
    // Treat .velite output as managed (immutable) so webpack doesn't
    // watch it for changes, prevents dev server crashes when Velite
    // regenerates large JSON files (2MB+)
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [...(config.snapshot?.managedPaths || []), velitePath],
    };
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/.velite/**"],
    };
    return config;
  },
  // The five course worlds were called "themes" until 2026-08-12. Published
  // links (audit blog posts, shared lesson URLs) still point at /themes/*,
  // so keep them alive permanently.
  redirects: async () => [
    { source: "/themes", destination: "/worlds", permanent: true },
    {
      source: "/themes/:path*",
      destination: "/worlds/:path*",
      permanent: true,
    },
    // /journey consolidated into /worlds while only one world is live
    // (2026-08-15): with a single launched world the two pages rendered
    // near-identical content. Deliberately temporary (307, not 308) so
    // browsers and crawlers don't cache it: the route returns at world-2
    // launch (restore checklist in docs/post-launch-backlog.md).
    { source: "/journey", destination: "/worlds", permanent: false },
  ],
  headers: async () => [
    // Long-lived immutable cache for build-hashed chunks. Filenames carry
    // a content hash so the URL changes whenever bytes change, safe to
    // pin for a year + tell the CDN to skip revalidation.
    // Production ONLY: dev chunk URLs are unhashed (chunks/app/page.js), so
    // this header makes browsers pin stale dev bundles for a year across
    // rebuilds and server restarts.
    ...(process.env.NODE_ENV === "development"
      ? []
      : [
          {
            source: "/_next/static/:path*",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=31536000, immutable",
              },
            ],
          },
        ]),
    {
      // Version-pinned TFJS runtime. The filename carries the version, so the
      // URL changes whenever the bytes do - the same immutability argument as
      // /_next/static above.
      //
      // Without this Next serves public/ with `max-age=0, must-revalidate`,
      // so this 1.4 MB file revalidated on every session while the exercise
      // runner fetches it on every lesson exercise. At 10k users that is the
      // difference between ~140 GB and multiple TB of egress, which matters
      // twice: once as bandwidth cost, and once because each revalidation
      // also used to wake the auth middleware (now excluded in middleware.ts).
      source: "/vendor/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      // Trained model weights. Content-addressed by directory name and only
      // ever replaced by publishing a new model, so they are immutable in
      // practice. `weights.bin` files are ~172 KB each and several lessons
      // pull them.
      source: "/models/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      // Optimized images: long client cache + edge cache, with SWR so a
      // background revalidation refreshes the entry without stalling the
      // user. 30 days of stale-while-revalidate is well within next/image
      // expectations for world art + lesson illustrations.
      source: "/_next/image/:path*",
      headers: [
        {
          key: "Cache-Control",
          value:
            "public, max-age=86400, s-maxage=86400, stale-while-revalidate=2592000",
        },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          // CSP for the web app. Allows: Stripe Checkout (script + frame +
          // form-action), PostHog EU, Sentry (browser SDK + ingest), Plausible,
          // Supabase (auth + storage + realtime), our own api.tensorcraft.app,
          // Google Fonts via next/font (inline-style pragma required), and
          // data:/blob: images for OG previews and canvas exports.
          // On 'unsafe-inline' and 'unsafe-eval', corrected 2026-08-23. The
          // previous comment attributed both to "Next.js hydration", which is
          // wrong and made the whole line look immovable:
          //
          //   script-src 'unsafe-eval'   GENUINELY required. PostHog's loader
          //     evaluates code at runtime, and removing it breaks analytics
          //     rather than tightening anything.
          //   script-src 'unsafe-inline' NOT a Next.js requirement. Next
          //     supports nonce-based CSP. It is here because we have no nonce
          //     plumbing: that needs middleware to mint a per-request nonce
          //     and thread it through, and it must be verified in a real
          //     browser because getting it wrong blocks every inline script
          //     and white-screens the site. Worth doing, not worth guessing.
          //   style-src 'unsafe-inline'  Effectively required, and this is the
          //     part that reads as "removable" and is not: the codebase styles
          //     heavily through inline `style={{ ... }}` attributes, which
          //     this directive governs. Removing it unstyles the product.
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://*.posthog.com https://browser.sentry-cdn.com https://cdn.jsdelivr.net",
            // The exercise grader runs learner code in a Worker built from a
            // Blob URL; without blob: here (worker-src falls back to
            // script-src otherwise) the worker is silently blocked and every
            // Run Tests click times out.
            "worker-src 'self' blob:",
            // Sentry ingest is region scoped and the host is NOT
            // interchangeable: our DSN lives on `ingest.de.sentry.io`, and a
            // CSP wildcard for `*.ingest.sentry.io` does not match it because
            // the suffix differs. Omitting the region host does not degrade
            // reporting, it blocks it outright and silently, in the browser,
            // where no server side tooling can see the failure.
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.tensorcraft.app https://api.stripe.com https://checkout.stripe.com https://*.posthog.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
            "frame-src https://js.stripe.com https://checkout.stripe.com",
            "img-src 'self' data: blob: https:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            "base-uri 'self'",
            "form-action 'self' https://checkout.stripe.com",
            "frame-ancestors 'none'",
            "object-src 'none'",
          ].join("; "),
        },
      ],
    },
  ],
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Sentry build plugin.
 *
 * This wrapper is what injects `instrumentation-client.ts` into the browser
 * bundle and uploads source maps. Without it the client SDK never
 * initializes, so browser errors are collected by nothing at all.
 *
 * It belongs HERE rather than in the repo root `next.config.js` the Sentry
 * wizard created: the Vercel project builds with `rootDirectory: apps/web`,
 * so a root config is never read.
 *
 * Source map upload additionally needs `SENTRY_AUTH_TOKEN` at build time.
 * Without it the build still succeeds and stack traces stay minified, which
 * is the right failure: a missing token should not break deploys.
 */
// Annotated explicitly rather than inferred. Without the annotation TS2742
// fires here, because the inferred type reaches into a pnpm-internal path
// that cannot be named portably.
const config: NextConfig = withSentryConfig(withAnalyzer(nextConfig), {
  org: "amira-salah",
  // Slug, not display name, and NOT the `nextjs` the Sentry wizard guessed.
  // A wrong slug does not fail the build: source maps upload to the wrong
  // project and stack traces stay minified, which looks identical to never
  // having set the auth token at all.
  project: "tensorcraft-nextjs",

  // Quiet locally, verbose in CI where the upload log is the only evidence
  // the source maps actually shipped.
  silent: !process.env.CI,
  widenClientFileUpload: true,

  webpack: {
    treeshake: {
      // Strips the Sentry SDK's own debug logging from the client bundle.
      // Replaces the deprecated top level `disableLogger`.
      removeDebugLogging: true,
    },
  },
});

export default config;

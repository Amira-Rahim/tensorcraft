import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  DEFAULT_WORLD,
  LAUNCHED_WORLDS,
  SCHEME_STORAGE_KEY,
} from "@tensorcraft/shared";
import { WorldProvider } from "./components/world-provider";
import { Nav } from "./components/nav";
import { CookieConsent } from "./components/cookie-consent";
import { ReportIssueButton } from "./components/report-issue-button";
import { SiteFooter } from "./components/site-footer";
import { AnalyticsProvider } from "./components/analytics-provider";
import { PlausibleScript } from "./components/plausible-script";
import { SessionListener } from "../lib/supabase/session-listener";
import { SessionToast } from "./components/session-toast";
import { GithubNudgeToast } from "./components/github-nudge-toast";
import { GuestProgressBridge } from "./components/guest-progress-bridge";
import "./globals.css";
import { ConsentGatedVercelAnalytics } from "./components/consent-gated-vercel-analytics";
import { ConsentGatedSpeedInsights } from "./components/consent-gated-speed-insights";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tensorcraft: Machine Learning for JavaScript Developers",
  description:
    "Learn machine learning with JavaScript and TensorFlow.js. Story-driven ML courses for JavaScript developers: train real models in the browser, no Python required. Covers TensorFlow JS, Transformers.js, LSTMs, CNNs, and transformer tutorials.",
  keywords: [
    "machine learning for javascript developers",
    "machine learning javascript",
    "learn machine learning javascript",
    "tensorflow js",
    "tensorflow.js",
    "tensorflow js tutorial",
    "transformers.js",
    "transformers js tutorial",
    "browser machine learning",
    "browser ml",
    "ml tutorial javascript",
    "javascript ml course",
    "node machine learning",
    "lstm javascript",
    "cnn javascript",
    "neural network javascript",
    "interactive ml course",
    "typescript machine learning",
  ],
  metadataBase: new URL("https://tensorcraft.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tensorcraft.app",
    siteName: "Tensorcraft",
    title: "Tensorcraft: Machine Learning for JavaScript Developers",
    description:
      "Learn machine learning with JavaScript and TensorFlow.js. Story-driven ML courses for JavaScript developers: train real models in the browser, no Python required.",
    images: [
      {
        url: "/api/og?title=Learn%20ML%20Through%20Code%20You%20Already%20Know&world=deep-orbit&subtitle=Interactive%2C%20story-driven%20ML%20education",
        width: 1200,
        height: 630,
        alt: "Tensorcraft: ML for JavaScript Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tensorcraft: Machine Learning for JavaScript Developers",
    description:
      "Learn machine learning with JavaScript and TensorFlow.js. Train real models in the browser, no Python required.",
    images: [
      "/api/og?title=Learn%20ML%20Through%20Code%20You%20Already%20Know&world=deep-orbit&subtitle=Interactive%2C%20story-driven%20ML%20education",
    ],
  },
};

// Viewport metadata kept separate from `metadata` per Next.js 15 contract.
// `viewportFit: "cover"` lets the layout extend behind the iOS notch when
// pages opt in with `env(safe-area-inset-*)`. User-zoom is intentionally left
// at the UA default (allowed), disabling zoom violates WCAG SC 1.4.4.
// `themeColor` (light-mode rollout, 2026-07-22) sets the browser-chrome
// (address bar / task switcher) color per OS scheme. SSR can't know the
// resolved app scheme (that's the FOUC script's job for the DOM attribute),
// but the media-query form lets the UA pick the right entry itself, so no
// client JS is needed for this one.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
    { media: "(prefers-color-scheme: light)", color: "#f5f5f2" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      data-world={DEFAULT_WORLD}
      // The FOUC script below sets `data-scheme="light"` synchronously
      // before hydration for OS-light visitors. React 19 compares the
      // server-rendered attributes (which never include `data-scheme`)
      // against the live DOM at hydration time and flags the difference as
      // a mismatch; `data-world` never triggered this because
      // `LAUNCHED_WORLDS` only ever resolves to the same server default.
      // Scoped one element deep (standard next-worlds-style fix) - it only
      // silences the warning for `<html>`'s own attributes, not its
      // subtree.
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("tc-active-world");if(t&&${JSON.stringify(LAUNCHED_WORLDS)}.includes(t)){document.documentElement.dataset.world=t}}catch(e){}try{var s=null;try{s=localStorage.getItem(${JSON.stringify(SCHEME_STORAGE_KEY)})}catch(e){}if(s!=="light"&&s!=="dark"){s=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(s==="light"){document.documentElement.dataset.scheme="light"}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Tensorcraft",
                url: "https://tensorcraft.app",
                // `logo` omitted deliberately. It previously asserted
                // https://tensorcraft.app/logo.png, which 404s - there is no
                // logo.png in public/, nor any PNG at all. A logo URL that
                // does not resolve fails the Organization rich result and is
                // a false claim in structured data. Restore this only when a
                // real asset exists at the path.
                description:
                  "Interactive, story-driven ML education for JavaScript developers.",
                sameAs: [],
              },
              // The five per-world Course objects that used to live here were
              // removed 2026-07-25 (R3-7): they rendered on EVERY route and
              // duplicated the richer page-level Course JSON-LD on
              // /worlds/[slug] (different name + offer for the same URL),
              // risking rich-result confusion. Course markup now lives only
              // on the page that describes the course.
              // FAQPage moved OUT of this sitewide block 2026-07-25
              // (Tier 1-OPS FAQPage item): claiming FAQPage on routes that
              // render no FAQ is the same wrong-page markup class as the
              // Course dedup above. It now lives on the two pages that
              // visibly render FAQ_ITEMS: / (page.tsx) and /pricing.
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Tensorcraft",
                url: "https://tensorcraft.app",
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <PlausibleScript />
        {/* Consent-gated (Tier 1-LEGAL): renders nothing pre-consent and
            drops queued events via beforeSend after a withdrawal. The bare
            <Analytics /> that sat here beaconed before consent and after
            an explicit reject. */}
        <ConsentGatedVercelAnalytics />
        <ConsentGatedSpeedInsights />
        <WorldProvider>
          {/* <PostHogProvider> was mounted here too. It duplicated
              AnalyticsProvider's init and $pageview capture exactly, so every
              pageview was counted twice and every conversion-rate denominator
              was 2x too large. AnalyticsProvider is the superset (it also
              owns session_started/session_ended). */}
          <>
            <AnalyticsProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:font-mono focus:font-medium"
                style={{
                  background: "var(--tc-primary, #6BAA8A)",
                  color: "var(--tc-on-primary, #181818)",
                }}
              >
                Skip to content
              </a>
              <Nav />
              <div className="flex-1" id="main-content">
                {children}
              </div>
              <SessionListener />
              <SessionToast />
              <GithubNudgeToast />
              <GuestProgressBridge />
              <SiteFooter />
              <CookieConsent />
              <ReportIssueButton />
            </AnalyticsProvider>
          </>
        </WorldProvider>
      </body>
    </html>
  );
}

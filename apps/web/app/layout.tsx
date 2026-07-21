import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DEFAULT_THEME, LAUNCHED_THEMES, PRICING } from "@tensorcraft/shared";
import { FAQ_ITEMS } from "./faq-data";
import { ThemeProvider } from "./components/theme-provider";
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
import { Analytics } from "@vercel/analytics/next";

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
  title:
    "Tensorcraft: Learn Machine Learning for Frontend Developers in JavaScript",
  description:
    "Learn machine learning with JavaScript and TensorFlow.js. Story-driven ML courses for frontend developers: train real models in the browser, no Python required. Covers TensorFlow JS, Transformers.js, LSTMs, CNNs, and transformer tutorials.",
  keywords: [
    "machine learning for frontend developers",
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
    "learn ml frontend",
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
    title:
      "Tensorcraft: Learn Machine Learning for Frontend Developers in JavaScript",
    description:
      "Learn machine learning with JavaScript and TensorFlow.js. Story-driven ML courses for frontend developers: train real models in the browser, no Python required.",
    images: [
      {
        url: "/api/og?title=Learn%20ML%20Through%20Code%20You%20Already%20Know&theme=deep-orbit&subtitle=Interactive%2C%20story-driven%20ML%20education",
        width: 1200,
        height: 630,
        alt: "Tensorcraft: ML for Frontend Engineers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Tensorcraft: Learn Machine Learning for Frontend Developers in JavaScript",
    description:
      "Learn machine learning with JavaScript and TensorFlow.js. Train real models in the browser, no Python required.",
    images: [
      "/api/og?title=Learn%20ML%20Through%20Code%20You%20Already%20Know&theme=deep-orbit&subtitle=Interactive%2C%20story-driven%20ML%20education",
    ],
  },
};

// Viewport metadata kept separate from `metadata` per Next.js 15 contract.
// `viewportFit: "cover"` lets the layout extend behind the iOS notch when
// pages opt in with `env(safe-area-inset-*)`. User-zoom is intentionally left
// at the UA default (allowed), disabling zoom violates WCAG SC 1.4.4.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      data-theme={DEFAULT_THEME}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("tc-active-theme");if(t&&${JSON.stringify(LAUNCHED_THEMES)}.includes(t)){document.documentElement.dataset.theme=t}}catch(e){}})()`,
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
                // https://tensorcraft.app/logo.png, which 404s — there is no
                // logo.png in public/, nor any PNG at all. A logo URL that
                // does not resolve fails the Organization rich result and is
                // a false claim in structured data. Restore this only when a
                // real asset exists at the path.
                description:
                  "Interactive, story-driven ML education for frontend engineers.",
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Deep Orbit: Time-Series & Signals",
                description:
                  "Build a deep-space signal classifier using RNNs and LSTMs. A story-driven course teaching time-series analysis and signal processing using browser-based ML. Built for frontend engineers.",
                provider: {
                  "@type": "Organization",
                  name: "Tensorcraft",
                  url: "https://tensorcraft.app",
                },
                url: "https://tensorcraft.app/themes/deep-orbit",
                educationalLevel: "Intermediate",
                programmingLanguage: ["JavaScript", "TypeScript"],
                teaches: [
                  "Time-series analysis",
                  "Signal processing",
                  "RNNs and LSTMs",
                  "Browser-based machine learning",
                  "TensorFlow.js",
                ],
                offers: {
                  "@type": "Offer",
                  price: String(PRICING.single.price),
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Neon Protocol: Computer Vision",
                description:
                  "Build an urban anomaly detection system using CNNs. A story-driven course teaching computer vision and image processing using browser-based ML. Built for frontend engineers.",
                provider: {
                  "@type": "Organization",
                  name: "Tensorcraft",
                  url: "https://tensorcraft.app",
                },
                url: "https://tensorcraft.app/themes/neon-protocol",
                educationalLevel: "Intermediate",
                programmingLanguage: ["JavaScript", "TypeScript"],
                teaches: [
                  "Computer vision",
                  "Convolutional neural networks",
                  "Image classification",
                  "Object detection",
                  "Browser-based machine learning",
                ],
                offers: {
                  "@type": "Offer",
                  price: String(PRICING.single.price),
                  priceCurrency: "USD",
                  availability: "https://schema.org/PreOrder",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Signal Ward: NLP & Text Intelligence",
                description:
                  "Build a clinical text intelligence assistant using transformers. A story-driven course teaching NLP and text processing using browser-based ML. Built for frontend engineers.",
                provider: {
                  "@type": "Organization",
                  name: "Tensorcraft",
                  url: "https://tensorcraft.app",
                },
                url: "https://tensorcraft.app/themes/signal-ward",
                educationalLevel: "Intermediate",
                programmingLanguage: ["JavaScript", "TypeScript"],
                teaches: [
                  "Natural language processing",
                  "Transformer models",
                  "Text classification",
                  "Sentiment analysis",
                  "Transformers.js",
                ],
                offers: {
                  "@type": "Offer",
                  price: String(PRICING.single.price),
                  priceCurrency: "USD",
                  availability: "https://schema.org/PreOrder",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Nova Canvas: Multimodal & Generative AI",
                description:
                  "Build a multimodal creative assistant using GANs and diffusion. A story-driven course teaching generative AI and multimodal systems using browser-based ML. Built for frontend engineers.",
                provider: {
                  "@type": "Organization",
                  name: "Tensorcraft",
                  url: "https://tensorcraft.app",
                },
                url: "https://tensorcraft.app/themes/nova-canvas",
                educationalLevel: "Intermediate",
                programmingLanguage: ["JavaScript", "TypeScript"],
                teaches: [
                  "Generative adversarial networks",
                  "Diffusion models",
                  "Multimodal AI",
                  "Image generation",
                  "Browser-based machine learning",
                ],
                offers: {
                  "@type": "Offer",
                  price: String(PRICING.single.price),
                  priceCurrency: "USD",
                  availability: "https://schema.org/PreOrder",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Terra Grid: Edge AI & Production ML",
                description:
                  "Build an edge-deployed monitoring system with MLOps. A story-driven course teaching Edge AI and production ML systems using browser-based ML. Built for frontend engineers.",
                provider: {
                  "@type": "Organization",
                  name: "Tensorcraft",
                  url: "https://tensorcraft.app",
                },
                url: "https://tensorcraft.app/themes/terra-grid",
                educationalLevel: "Intermediate",
                programmingLanguage: ["JavaScript", "TypeScript"],
                teaches: [
                  "Edge AI deployment",
                  "MLOps",
                  "Model optimization",
                  "Production machine learning",
                  "TensorFlow.js",
                ],
                offers: {
                  "@type": "Offer",
                  price: String(PRICING.single.price),
                  priceCurrency: "USD",
                  availability: "https://schema.org/PreOrder",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                // Mirrors the visible landing FAQ, single source in
                // app/faq-data.ts so schema and page content can't drift.
                mainEntity: FAQ_ITEMS.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              },
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
        <Analytics />
        <ThemeProvider>
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
                  color: "var(--tc-bg, #181818)",
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
        </ThemeProvider>
      </body>
    </html>
  );
}

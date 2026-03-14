import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "./components/nav";
import { CookieConsent } from "./components/cookie-consent";
import { SiteFooter } from "./components/site-footer";
import { SessionListener } from "../lib/supabase/session-listener";
import "./globals.css";

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
  title: "Tensorcraft — Learn ML Through Code You Already Know",
  description:
    "Interactive, story-driven ML education for frontend engineers. Build real models in the browser using JavaScript, TypeScript, and tools you already love.",
  keywords: [
    "machine learning",
    "frontend",
    "javascript",
    "browser ML",
    "interactive course",
    "TensorFlow.js",
    "Transformers.js",
  ],
  metadataBase: new URL("https://tensorcraft.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tensorcraft.dev",
    siteName: "Tensorcraft",
    title: "Tensorcraft — Learn ML Through Code You Already Know",
    description:
      "Interactive, story-driven ML education for frontend engineers. Build real models in the browser using JavaScript, TypeScript, and tools you already love.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tensorcraft — ML for Frontend Engineers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tensorcraft — Learn ML Through Code You Already Know",
    description:
      "Interactive, story-driven ML education for frontend engineers.",
    images: ["/og-image.png"],
  },
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
      data-theme="deep-orbit"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Tensorcraft",
                url: "https://tensorcraft.dev",
                logo: "https://tensorcraft.dev/logo.png",
                description:
                  "Interactive, story-driven ML education for frontend engineers.",
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Deep Orbit — Time-Series & Signals",
                description:
                  "A story-driven course teaching time-series analysis and signal processing using browser-based ML. Built for frontend engineers.",
                provider: {
                  "@type": "Organization",
                  name: "Tensorcraft",
                  url: "https://tensorcraft.dev",
                },
                url: "https://tensorcraft.dev/themes/deep-orbit",
                educationalLevel: "Intermediate",
                programmingLanguage: ["JavaScript", "TypeScript"],
                teaches: [
                  "Time-series analysis",
                  "Signal processing",
                  "Browser-based machine learning",
                  "TensorFlow.js",
                ],
                offers: {
                  "@type": "Offer",
                  price: "79",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:font-mono focus:font-medium"
          style={{
            background: "var(--tc-primary, #6BAA8A)",
            color: "#1C1C1C",
          }}
        >
          Skip to content
        </a>
        <Nav />
        <div className="flex-1" id="main-content">
          {children}
        </div>
        <SessionListener />
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}

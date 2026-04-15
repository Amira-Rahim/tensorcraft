import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DEFAULT_THEME } from "@tensorcraft/shared";
import { Nav } from "./components/nav";
import { Ticker } from "./components/ticker";
import { CookieConsent } from "./components/cookie-consent";
import { ReportIssueButton } from "./components/report-issue-button";
import { SiteFooter } from "./components/site-footer";
import { AnalyticsProvider } from "./components/analytics-provider";
import { PlausibleScript } from "./components/plausible-script";
import { SessionListener } from "../lib/supabase/session-listener";
import { SessionToast } from "./components/session-toast";
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
  metadataBase: new URL("https://tensorcraft.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tensorcraft.app",
    siteName: "Tensorcraft",
    title: "Tensorcraft — Learn ML Through Code You Already Know",
    description:
      "Interactive, story-driven ML education for frontend engineers. Build real models in the browser using JavaScript, TypeScript, and tools you already love.",
    images: [
      {
        url: "/api/og?title=Learn%20ML%20Through%20Code%20You%20Already%20Know&theme=deep-orbit&subtitle=Interactive%2C%20story-driven%20ML%20education",
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
    images: [
      "/api/og?title=Learn%20ML%20Through%20Code%20You%20Already%20Know&theme=deep-orbit&subtitle=Interactive%2C%20story-driven%20ML%20education",
    ],
  },
  alternates: {
    canonical: "https://tensorcraft.app",
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
      data-theme={DEFAULT_THEME}
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
                url: "https://tensorcraft.app",
                logo: "https://tensorcraft.app/logo.png",
                description:
                  "Interactive, story-driven ML education for frontend engineers.",
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Deep Orbit — Time-Series & Signals",
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
                  price: "79",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Neon Protocol — Computer Vision",
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
                  price: "79",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Signal Ward — NLP & Text Intelligence",
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
                  price: "79",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Nova Canvas — Multimodal & Generative AI",
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
                  price: "79",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "Course",
                name: "Terra Grid — Edge AI & Production ML",
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
                  price: "79",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Can I learn machine learning with JavaScript?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Tensorcraft teaches ML entirely in JavaScript and TypeScript using TensorFlow.js. Models train and run in the browser — no Python required.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How does Tensorcraft teach ML to frontend developers?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Tensorcraft uses 50+ 'bridge' analogies that map frontend concepts you already know (like useState, Array.map, and fetch) to their ML equivalents (model weights, tensor operations, and inference APIs). Each course is a story-driven narrative where you build real ML models.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is Tensorcraft free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Module 1 of every theme is free — no account or credit card required. Full themes cost $79 each, with bundle discounts available up to $219 for all 5 themes.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What ML topics does Tensorcraft cover?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Five specializations: Time-Series & Signals (RNNs, LSTMs), Computer Vision (CNNs, YOLO), NLP & Text Intelligence (Transformers, BERT), Multimodal & Generative AI (GANs, Diffusion), and Edge AI & Production ML (quantization, MLOps).",
                    },
                  },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Tensorcraft",
                url: "https://tensorcraft.app",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate:
                      "https://tensorcraft.app/glossary?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <PlausibleScript />
        <AnalyticsProvider>
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
          <Ticker />
          <div className="flex-1" id="main-content">
            {children}
          </div>
          <SessionListener />
          <SessionToast />
          <SiteFooter />
          <CookieConsent />
          <ReportIssueButton />
        </AnalyticsProvider>
      </body>
    </html>
  );
}

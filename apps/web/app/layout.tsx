import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

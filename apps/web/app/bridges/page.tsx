import type { Metadata } from "next";
import { BridgeExplorer } from "./bridge-explorer";

export const metadata: Metadata = {
  title: "Bridge Explorer | Tensorcraft",
  description:
    "Browse 50+ concept bridges that map frontend engineering patterns to machine learning concepts. Discover how React state, middleware chains, and DOM APIs connect to ML fundamentals.",
};

export default function BridgesPage() {
  return (
    <main className="min-h-screen px-4 py-16 sm:px-8 max-w-7xl mx-auto">
      <header className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Bridge Explorer
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          50+ concept bridges that map frontend patterns you already know to
          machine learning fundamentals. Search by either side.
        </p>
      </header>

      <BridgeExplorer />
    </main>
  );
}

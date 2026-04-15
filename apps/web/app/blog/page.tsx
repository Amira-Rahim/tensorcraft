import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Bridge — Frontend-to-ML Insights | Tensorcraft",
  description:
    "Articles, tutorials, and deep dives bridging frontend engineering and machine learning.",
  openGraph: {
    title: "The Bridge — Frontend-to-ML Insights | Tensorcraft",
    description:
      "Articles, tutorials, and deep dives bridging frontend engineering and machine learning.",
    url: "https://tensorcraft.app/blog",
  },
  alternates: { canonical: "https://tensorcraft.app/blog" },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10">
        <div className="font-mono text-xs text-primary tracking-[0.14em] uppercase mb-6 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Blog
        </div>

        <h1 className="text-4xl md:text-[56px] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-4 uppercase">
          The Bridge
        </h1>

        <p className="text-lg font-mono text-text-muted leading-relaxed max-w-[560px] mb-16">
          Articles, tutorials, and deep dives bridging frontend engineering and
          machine learning
        </p>

        <div className="border border-border bg-surface p-10">
          <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-4">
            // status: pending
          </div>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            We are preparing the first batch of articles. Check back soon for
            deep dives into browser-based ML, concept bridges, and practical
            tutorials for frontend engineers.
          </p>
          <div className="flex gap-4">
            {["Concept Bridges", "Browser ML", "Tutorials", "Case Studies"].map(
              (tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs text-text-muted tracking-wider uppercase border border-border px-3 py-1.5"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

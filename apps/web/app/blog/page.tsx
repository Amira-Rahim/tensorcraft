import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Bridge — Tensorcraft Blog",
  description:
    "Articles, tutorials, and insights on browser-based machine learning for frontend engineers. Learn how your existing JavaScript skills map to ML concepts.",
  openGraph: {
    title: "The Bridge — Tensorcraft Blog",
    description:
      "Articles, tutorials, and insights on browser-based machine learning for frontend engineers.",
    url: "https://tensorcraft.dev/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen px-8 md:px-20 pt-24 pb-28">
      <div className="max-w-3xl">
        <div className="font-mono text-[11px] text-primary tracking-[0.14em] uppercase mb-6 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Blog
        </div>

        <h1 className="text-4xl md:text-[56px] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-8 uppercase">
          The Bridge
        </h1>

        <p className="text-base text-text-muted leading-relaxed max-w-[520px] mb-16">
          Articles on browser-based ML, frontend-to-ML concept bridges, and
          tutorials for engineers making the leap. Coming soon.
        </p>

        <div className="border border-border p-10">
          <div className="font-mono text-[11px] text-text-muted tracking-wider uppercase mb-4">
            // status: pending
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            We are preparing the first batch of articles. Subscribe to get
            notified when they go live.
          </p>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@tensorcraft/content";
import { BLOG_DESCRIPTION } from "./blog-details";

export const metadata: Metadata = {
  title: "The Bridge: JavaScript-to-ML Insights, Tensorcraft",
  description: BLOG_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Tensorcraft",
    title: "The Bridge: JavaScript-to-ML Insights, Tensorcraft",
    description: BLOG_DESCRIPTION,
    url: "https://tensorcraft.app/blog",
    images: [
      "/api/og?title=The%20Bridge&world=deep-orbit&subtitle=JavaScript-to-ML%20notes",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Bridge: JavaScript-to-ML Insights, Tensorcraft",
    description: BLOG_DESCRIPTION,
    images: [
      "/api/og?title=The%20Bridge&world=deep-orbit&subtitle=JavaScript-to-ML%20notes",
    ],
  },
  alternates: {
    canonical: "https://tensorcraft.app/blog",
    types: { "application/rss+xml": "https://tensorcraft.app/blog/rss.xml" },
  },
};

export default function BlogIndexPage() {
  const posts = getPosts();

  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      {/* Redesign pass (owner, 2026-09-01, same family as landing//learn//
          pricing//worlds): fluid title, wider grid, md+ type bumps. */}
      <div className="max-w-6xl relative z-10">
        <div className="font-mono text-xs text-primary tracking-[0.14em] uppercase mb-6 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Blog
        </div>

        {/* Fluid one-liner: 10 mono chars at 0.555em per char; the family
            clamp (shared with the landing wall) lands 128px at 1440. */}
        {/* The owner removed the introductory paragraph on 2026-09-01.
            Keep the title and its spacing. */}
        <h1 className="text-[clamp(3rem,calc(10vw-1rem),8.5rem)] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-16 uppercase">
          The Bridge
        </h1>

        {posts.length === 0 ? (
          <div className="border border-border bg-surface p-10">
            <p className="text-base text-text-muted">
              We haven&apos;t published any posts yet. Our practical guides
              explain machine learning through JavaScript examples.
            </p>
            <Link
              href="/guides"
              className="mt-4 inline-block text-primary underline underline-offset-4"
            >
              JavaScript machine learning guides
            </Link>
          </div>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="border border-border bg-surface p-6 md:p-8"
              >
                <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs md:text-sm text-text-muted tracking-wider uppercase mb-2">
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toISOString().slice(0, 10)}
                  </time>
                  {post.weekIso && <span>{post.weekIso}</span>}
                  {post.worldSlug && <span>{post.worldSlug}</span>}
                </p>
                <h2 className="text-xl md:text-3xl font-mono font-bold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm md:text-base text-text-muted leading-relaxed">
                  {post.summary}
                </p>
                {post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-xs text-text-muted tracking-wider uppercase border border-border px-2 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

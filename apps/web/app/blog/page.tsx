import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@tensorcraft/content";

export const metadata: Metadata = {
  title: "The Bridge — Frontend-to-ML Insights | Tensorcraft",
  description:
    "Weekly browser-ML news, mapped to the lessons that teach the underlying concepts.",
  openGraph: {
    title: "The Bridge — Frontend-to-ML Insights | Tensorcraft",
    description:
      "Weekly browser-ML news, mapped to the lessons that teach the underlying concepts.",
    url: "https://tensorcraft.app/blog",
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

      <div className="max-w-3xl relative z-10">
        <div className="font-mono text-xs text-primary tracking-[0.14em] uppercase mb-6 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Blog
        </div>

        <h1 className="text-4xl md:text-[56px] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-4 uppercase">
          The Bridge
        </h1>

        <p className="text-lg font-mono text-text-muted leading-relaxed max-w-[560px] mb-16">
          Weekly browser-ML news, mapped to the lessons that teach the
          underlying concepts.
        </p>

        {posts.length === 0 ? (
          <div className="border border-border bg-surface p-10">
            <p className="text-sm text-text-muted">
              First post drops once the curator shortlists this week's items.
            </p>
          </div>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="border border-border bg-surface p-6"
              >
                <p className="font-mono text-xs text-text-muted tracking-wider uppercase mb-2">
                  {new Date(post.publishedAt).toISOString().slice(0, 10)}
                  {post.weekIso ? ` · ${post.weekIso}` : ""}
                  {post.themeSlug ? ` · ${post.themeSlug}` : ""}
                </p>
                <h2 className="text-xl md:text-2xl font-mono font-bold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
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

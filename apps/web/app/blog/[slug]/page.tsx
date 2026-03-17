import type { Metadata } from "next";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug.replace(/-/g, " ")} — Tensorcraft Blog`,
    description: `Read "${slug.replace(/-/g, " ")}" on the Tensorcraft blog.`,
    openGraph: {
      title: `${slug.replace(/-/g, " ")} — Tensorcraft Blog`,
      url: `https://tensorcraft.dev/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  void slug;

  // No posts exist yet. When a content system (MDX/CMS) is integrated,
  // look up the post by slug here and render it.

  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-3xl relative z-10">
        <div className="font-mono text-[11px] text-text-muted tracking-wider mb-10 flex items-center gap-2">
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-text-primary">{slug}</span>
        </div>

        <div className="border border-border bg-surface p-10">
          <div className="font-mono text-[11px] text-primary tracking-wider uppercase mb-4">
            // 404
          </div>
          <h1 className="text-2xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
            Post not found
          </h1>
          <p className="text-sm text-text-muted leading-relaxed mb-8">
            This post does not exist yet. Our blog is coming soon with articles
            bridging frontend engineering and machine learning.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-border text-text-primary font-bold text-sm font-mono tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            &larr; Back to blog
          </Link>
        </div>
      </div>
    </main>
  );
}

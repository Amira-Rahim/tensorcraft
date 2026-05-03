import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@tensorcraft/content";
import { PostBody } from "./post-body";
import { LessonLink } from "./lesson-link";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return { title: "Not found — Tensorcraft Blog" };
  }
  const lessonTitle = post.matchedLessons?.[0]?.title;
  const ogParams = new URLSearchParams({
    kind: "digest",
    title: post.title,
  });
  if (post.themeSlug) ogParams.set("theme", post.themeSlug);
  if (lessonTitle) ogParams.set("lessonTitle", lessonTitle);
  if (post.sourceLabel) ogParams.set("sourceLabel", post.sourceLabel);
  const og = `/api/og?${ogParams.toString()}`;
  return {
    title: `${post.title} — Tensorcraft Blog`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `https://tensorcraft.app/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: og }],
    },
    twitter: { card: "summary_large_image", title: post.title, images: [og] },
    alternates: { canonical: `https://tensorcraft.app/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          href="/blog"
          className="font-mono text-xs text-text-muted tracking-wider uppercase hover:text-primary"
        >
          ← The Bridge
        </Link>

        <header className="mt-8 mb-12">
          <p className="font-mono text-xs text-text-muted tracking-wider uppercase mb-4">
            {new Date(post.publishedAt).toISOString().slice(0, 10)}
            {post.weekIso ? ` · ${post.weekIso}` : ""}
            {post.themeSlug ? ` · ${post.themeSlug}` : ""}
            {post.sourceLabel ? ` · via ${post.sourceLabel}` : ""}
          </p>
          <h1 className="text-3xl md:text-5xl font-mono font-black leading-[1.05] tracking-[-0.03em] mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-text-muted leading-relaxed">
            {post.summary}
          </p>
          {post.sourceUrl && (
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-mono text-xs text-primary tracking-wider uppercase hover:underline"
            >
              ↗ Original source
            </a>
          )}
        </header>

        <article className="lesson-prose mb-16">
          <PostBody body={post.body} />
        </article>

        {post.matchedLessons.length > 0 && (
          <aside className="border border-border bg-surface p-6">
            <h2 className="font-mono text-xs text-text-muted tracking-wider uppercase mb-4">
              Lessons that teach this
            </h2>
            <ul className="space-y-3">
              {post.matchedLessons.map((m) => (
                <li key={`${m.themeId}/${m.moduleId}/${m.slug}`}>
                  <LessonLink
                    postSlug={post.slug}
                    weekIso={post.weekIso}
                    themeId={m.themeId}
                    moduleId={m.moduleId}
                    slug={m.slug}
                    title={m.title}
                    rationale={m.rationale}
                  />
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </main>
  );
}

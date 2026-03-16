import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  // When a content system is added, look up the post here.
  // For now, all slugs 404 so metadata is a fallback.
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
  // No posts exist yet. When a content system (MDX/CMS) is integrated,
  // look up the post by slug here and render it.
  const _slug = (await params).slug;
  void _slug;
  notFound();
}

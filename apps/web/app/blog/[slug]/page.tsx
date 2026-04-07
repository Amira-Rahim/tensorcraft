import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
      url: `https://tensorcraft.app/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage(_props: BlogPostPageProps) {
  // No posts exist yet. When a content system (MDX/CMS) is integrated,
  // look up the post by slug here and render it.
  // For now, all slugs are 404.
  notFound();
}

import { notFound, redirect } from "next/navigation";
import { LAUNCHED_WORLDS, isLaunched } from "@tensorcraft/shared";
import { getModules } from "@tensorcraft/content";

interface Props {
  params: Promise<{ slug: string; module: string }>;
}

// Unknown modules and coming-soon worlds 404 at the router level (real 404
// status, before any streaming).
export function generateStaticParams() {
  return LAUNCHED_WORLDS.flatMap((slug) =>
    getModules(slug).map((m) => ({ slug, module: m.slug })),
  );
}
export const dynamicParams = false;

/**
 * Module-overview shim. There is no standalone module page in the current
 * design, the world page's module map is the canonical module overview.
 * This route exists because real surfaces still link to
 * `/worlds/{slug}/{module}`: the lesson page's "Go to previous module"
 * prerequisite gate and the BreadcrumbList JSON-LD on every lesson. Without
 * it those links land on a 404.
 *
 * Valid module of a launched world → redirect to the world page.
 * Anything else → real 404.
 */
export default async function ModuleOverviewPage({ params }: Props) {
  // dynamicParams=false rejects unknown params in dev, but `next start`
  // does NOT enforce it at the router (2026-07-12 round-4 prod audit), so
  // the body must validate for itself or invalid modules would 307 to the
  // world map instead of 404ing.
  const { slug, module: moduleSlug } = await params;
  const valid =
    isLaunched(slug) && getModules(slug).some((m) => m.slug === moduleSlug);
  if (!valid) notFound();
  redirect(`/worlds/${slug}`);
}

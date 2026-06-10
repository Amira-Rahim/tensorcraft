import { redirect } from "next/navigation";
import { LAUNCHED_THEMES } from "@tensorcraft/shared";
import { getModules } from "@tensorcraft/content";

interface Props {
  params: Promise<{ slug: string; module: string }>;
}

// Unknown modules and coming-soon themes 404 at the router level (real 404
// status, before any streaming).
export function generateStaticParams() {
  return LAUNCHED_THEMES.flatMap((slug) =>
    getModules(slug).map((m) => ({ slug, module: m.slug })),
  );
}
export const dynamicParams = false;

/**
 * Module-overview shim. There is no standalone module page in the current
 * design — the theme page's module map is the canonical module overview.
 * This route exists because real surfaces still link to
 * `/themes/{slug}/{module}`: the lesson page's "Go to previous module"
 * prerequisite gate and the BreadcrumbList JSON-LD on every lesson. Without
 * it those links land on a 404.
 *
 * Valid module of a launched theme → redirect to the theme page.
 * Anything else → real 404.
 */
export default async function ModuleOverviewPage({ params }: Props) {
  // dynamicParams=false already rejected anything outside the launched
  // theme/module set, so any params that reach here are valid.
  const { slug } = await params;
  redirect(`/themes/${slug}`);
}

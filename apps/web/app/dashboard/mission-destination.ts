import type { DashboardModule } from "./dashboard-view";

export function moduleDestination(module: DashboardModule, worldSlug: string) {
  return module.lockReason === "access"
    ? `/pricing?locked=${worldSlug}&module=${module.slug}`
    : `/worlds/${worldSlug}#module-${module.slug}`;
}

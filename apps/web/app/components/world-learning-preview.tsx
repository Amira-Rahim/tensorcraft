import Link from "next/link";
import {
  TRANSFER_CAPABILITIES,
  WORLD_LEARNING_SCOPE,
  WORLD_RELEASE,
  type WorldSlug,
} from "@tensorcraft/shared";
import { VisionPreview } from "./vision-preview";

export function WorldLearningPreview({ worldSlug }: { worldSlug: WorldSlug }) {
  const scope = WORLD_LEARNING_SCOPE[worldSlug];
  const release = WORLD_RELEASE[worldSlug];
  return (
    <section
      className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 py-12 space-y-6"
      aria-label="Learning scope and availability"
    >
      <h2 className="text-2xl font-bold">What this world adds</h2>
      <p className="font-mono text-xs uppercase text-primary">
        {release.status === "preview"
          ? "Sample available, full course coming later"
          : release.courseAvailable
            ? "Course available"
            : "Forthcoming"}
      </p>
      <p className="leading-relaxed">Planned project: {scope.outcome}</p>
      <p className="leading-relaxed">New work: {scope.adds}</p>
      <details className="border border-border p-4">
        <summary className="font-medium cursor-pointer">
          Skills you can bring from Deep Orbit
        </summary>
        <ul className="mt-4 space-y-2">
          {scope.reuses.map((key) => (
            <li key={key}>
              <Link
                className="underline underline-offset-4"
                href={TRANSFER_CAPABILITIES[key].href}
              >
                {TRANSFER_CAPABILITIES[key].label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-text-muted">
          Use these links to revisit anything you need. You can continue without
          repeating the course. Later Deep Orbit modules require access.
          Finishing Deep Orbit gives you a starting point. You’ll still need to
          learn this world’s new concepts.
        </p>
      </details>
      {worldSlug === "neon-protocol" ? (
        <VisionPreview />
      ) : (
        <p className="text-sm text-text-muted">
          We are reviewing the full curriculum. This page describes its intended
          scope. No lessons or checkout are available for this world yet.
        </p>
      )}
    </section>
  );
}

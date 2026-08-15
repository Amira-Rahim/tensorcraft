import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { DEFAULT_WORLD } from "@tensorcraft/shared";
import { surfacePlateSrc } from "@/lib/location-art";

// App-global page, so the default world's plate: a probe adrift, tether
// loose. The copy says the route is lost; the art says how far.
const ADRIFT_PLATE_SRC = surfacePlateSrc(DEFAULT_WORLD, "not-found");

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {ADRIFT_PLATE_SRC && (
          <div className="mb-8" aria-hidden="true">
            <ArtPlate src={ADRIFT_PLATE_SRC} />
          </div>
        )}
        <div className="border border-border bg-surface p-10 rounded-none">
          <div className="font-mono text-xs text-text-muted tracking-wider uppercase mb-4">
            404 · ROUTE NOT FOUND
          </div>
          <h1 className="text-xl font-mono font-black tracking-[-0.03em] mb-4 uppercase text-text-primary">
            Page not found
          </h1>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Primary CTA must work for EVERYONE: /dashboard 307s anonymous
              visitors to the auth wall - a 404 → sign-in bounce for the
              people most likely to hit a 404 (bad inbound link). /worlds is
              public and useful either way (Tier 2 small-UX, 2026-07-25). */}
            <Link
              href="/worlds"
              className="px-6 py-3 border-2 border-primary bg-primary/10 text-primary font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:bg-primary/20 transition-colors text-center"
            >
              Browse worlds
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-border bg-transparent text-text-muted font-mono text-sm font-bold uppercase tracking-wider rounded-none hover:text-text-primary hover:border-primary/30 transition-colors text-center"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

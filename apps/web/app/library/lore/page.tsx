import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LORE_CATALOG } from "@/lib/lore-catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lore archive | Tensorcraft",
  description: "Recovered field notes, boot logs, and DISPATCH bulletins.",
  robots: { index: false, follow: false },
};

export default async function LibraryLorePage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirectTo=/library/lore");

  const { data: drops } = await supabase
    .from("lore_drops")
    .select("artifact_id, dropped_at, read_at")
    .eq("user_id", user.id)
    .order("dropped_at", { ascending: false });

  const collectedIds = new Set((drops ?? []).map((d) => d.artifact_id));
  const total = LORE_CATALOG.length;
  const collected = collectedIds.size;

  return (
    <main
      className="max-w-3xl mx-auto px-6 py-12"
      data-testid="library-lore-page"
    >
      <header className="mb-10">
        <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-2">
          Lore archive
        </p>
        <h1 className="text-3xl font-bold mb-3 text-text-primary">
          Recovered transmissions
        </h1>
        <p className="text-sm text-text-muted leading-relaxed max-w-[640px]">
          DISPATCH ships an artifact at random when you complete a lesson. Drop
          chance is ~20%, capped at one per day. Collected:{" "}
          <strong className="text-text-primary">
            {collected} / {total}
          </strong>
          .
        </p>
      </header>

      {collected === 0 && (
        <div className="p-8 brutalist-shadow bg-surface-raised border border-border text-center">
          <h2 className="text-lg font-semibold mb-2 text-text-primary">
            No transmissions yet
          </h2>
          <p className="text-sm text-text-muted mb-5">
            Complete a lesson and DISPATCH may transmit. Or may not. The drop is
            random; that&apos;s the point.
          </p>
          <Link
            href="/themes"
            className="inline-block px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 brutalist-hover"
          >
            Browse themes
          </Link>
        </div>
      )}

      <ol className="space-y-4">
        {LORE_CATALOG.map((artifact) => {
          const isCollected = collectedIds.has(artifact.id);
          return (
            <li
              key={artifact.id}
              data-testid={`lore-entry-${artifact.id}`}
              data-collected={isCollected ? "true" : "false"}
            >
              <article
                className="p-5 brutalist-shadow border"
                style={{
                  background: isCollected
                    ? "var(--tc-surface-overlay)"
                    : "var(--tc-surface)",
                  borderColor: isCollected
                    ? "var(--tc-border)"
                    : "color-mix(in srgb, var(--tc-border) 50%, transparent)",
                  opacity: isCollected ? 1 : 0.45,
                }}
              >
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-text-muted mb-1">
                  {artifact.source}
                </p>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  {isCollected ? artifact.title : "Untransmitted"}
                </h3>
                {isCollected ? (
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                    {artifact.body}
                  </p>
                ) : (
                  <p className="text-sm text-text-muted italic">
                    Encrypted. Continue lessons; DISPATCH may transmit.
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      <footer className="mt-12 pt-6 border-t border-border text-center">
        <Link
          href="/log"
          className="text-xs font-mono uppercase tracking-wider text-text-muted hover:text-text-primary"
        >
          ← Back to log
        </Link>
      </footer>
    </main>
  );
}

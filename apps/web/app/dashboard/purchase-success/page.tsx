import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getModules } from "@tensorcraft/content";
import { themes } from "@tensorcraft/themes";
import { DEFAULT_THEME } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";
import { PurchaseAnalytics } from "./purchase-analytics";

export const metadata: Metadata = {
  title: "Purchase Confirmed | Tensorcraft",
  description: "Your theme is now fully unlocked.",
};

export default async function PurchaseSuccessPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Get most recent purchase
  const { data: purchase } = await supabase
    .from("purchases")
    .select("plan_id, theme_ids, amount, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const purchasedThemeIds: string[] = purchase?.theme_ids ?? [];
  const firstTheme = purchasedThemeIds[0] ?? DEFAULT_THEME;
  const theme = themes[firstTheme];
  const themeModules = theme ? getModules(firstTheme) : [];

  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <AmbientBackground count={220} />
      <div className="max-w-2xl mx-auto px-6 py-20 text-center relative z-10">
        {/* Confirmation hero */}
        <div
          className="text-5xl mb-6"
          style={{ color: theme?.palette.primary ?? "var(--tc-primary)" }}
        >
          &#10003;
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-mono mb-3 text-text-primary">
          You&apos;re In
        </h1>
        <p className="text-lg mb-8 text-text-muted">
          {theme
            ? `${theme.displayName} is now fully unlocked. All ${themeModules.length} modules are ready.`
            : "Your purchase is confirmed. All content is now unlocked."}
        </p>

        {purchase && (
          <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono mb-12 border border-border bg-surface-raised text-text-muted">
            <PurchaseAnalytics
              planId={purchase.plan_id}
              amount={purchase.amount}
            />
            <span className="text-text-primary">{purchase.plan_id}</span>
            <span>&middot;</span>
            <span>${purchase.amount}</span>
            <span>&middot;</span>
            <span>Lifetime access</span>
          </div>
        )}

        {/* Unlocked modules list */}
        {theme && themeModules.length > 0 && (
          <div className="p-6 mb-10 text-left bg-surface-raised border border-border">
            <h2 className="text-xs font-semibold font-mono uppercase tracking-widest mb-4 text-text-muted">
              Unlocked Modules
            </h2>
            <ul className="space-y-2">
              {themeModules.map((mod) => (
                <li key={mod.slug} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 flex items-center justify-center"
                    style={{
                      background: `${theme.palette.primary}20`,
                      color: theme.palette.primary,
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    M{mod.order}
                  </span>
                  <span className="text-sm text-text-primary">{mod.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next steps */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/themes/${firstTheme}`}
            className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-medium font-mono bg-primary text-page border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
          >
            Start Learning &rarr;
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-medium font-mono border border-border text-text-muted hover:text-text-primary hover:border-primary/30 transition-all brutalist-hover"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

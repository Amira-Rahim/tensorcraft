import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getModules } from "@tensorcraft/content";
import { themes } from "@tensorcraft/themes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Confirmed | Tensorcraft",
  description: "Your theme is now fully unlocked.",
};

export default async function PurchaseSuccessPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

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
  const firstTheme = purchasedThemeIds[0] ?? "deep-orbit";
  const theme = themes[firstTheme];
  const themeModules = theme ? getModules(firstTheme) : [];

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Confirmation hero */}
        <div
          className="text-5xl mb-6"
          style={{ color: theme?.palette.accent ?? "#00D4FF" }}
        >
          &#10003;
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: "var(--tc-text, #FFFFFF)" }}
        >
          You&apos;re In
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          {theme
            ? `${theme.displayName} is now fully unlocked. All ${themeModules.length} modules are ready.`
            : "Your purchase is confirmed. All content is now unlocked."}
        </p>

        {purchase && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-12"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--tc-muted, #8B92A5)",
            }}
          >
            <span style={{ color: "var(--tc-text, #FFFFFF)" }}>
              {purchase.plan_id}
            </span>
            <span>&middot;</span>
            <span>${purchase.amount}</span>
            <span>&middot;</span>
            <span>Lifetime access</span>
          </div>
        )}

        {/* Unlocked modules list */}
        {theme && themeModules.length > 0 && (
          <div
            className="rounded-2xl p-6 mb-10 text-left"
            style={{
              background: "var(--tc-surface, #0F1320)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--tc-muted, #8B92A5)" }}
            >
              Unlocked Modules
            </h2>
            <ul className="space-y-2">
              {themeModules.map((mod) => (
                <li key={mod.slug} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: `${theme.palette.accent}20`,
                      color: theme.palette.accent,
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
                  <span
                    className="text-xs font-mono"
                    style={{ color: theme.palette.muted }}
                  >
                    M{mod.order}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--tc-text, #FFFFFF)" }}
                  >
                    {mod.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next steps */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/themes/${firstTheme}`}
            className="inline-flex items-center justify-center h-12 px-8 rounded-full text-[15px] font-medium transition-all"
            style={{
              border: `1px solid ${theme?.palette.accent ?? "#00D4FF"}50`,
              background: `${theme?.palette.accent ?? "#00D4FF"}12`,
              color: "#FFFFFF",
            }}
          >
            Start Learning &rarr;
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full text-[15px] font-medium transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "var(--tc-muted, #8B92A5)",
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

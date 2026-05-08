import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getModules } from "@tensorcraft/content";
import { themes } from "@tensorcraft/themes";
import { DEFAULT_THEME, isLaunched } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";
import { PurchaseAnalytics } from "./purchase-analytics";

export const metadata: Metadata = {
  title: "Purchase Confirmed | Tensorcraft",
  description: "Your theme is now fully unlocked.",
  robots: { index: false, follow: false },
};

/**
 * Format a USD amount for the receipt. Purchases are stored in dollars
 * (not cents), so we pass the number directly to Intl.NumberFormat.
 */
function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Format a date as `YYYY-MM-DD HH:MM UTC` in mono-friendly ISO-ish form.
 * Falls back to the raw string if parsing fails.
 */
function formatReceiptDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}

/** Last-8 hash for `stripe_session_id`, safe for display. */
function shortenSessionId(sessionId: string | null | undefined): string {
  if (!sessionId) return "—";
  return sessionId.length <= 8 ? sessionId : sessionId.slice(-8);
}

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Stripe's success_url embeds `?session_id={CHECKOUT_SESSION_ID}`.
  // When present we look up the exact purchase row; otherwise fall back to
  // the user's most recent completed purchase (defends against users who
  // land here via direct nav or refresh without the query param).
  const params = (await searchParams) ?? {};
  const rawSessionId = params.session_id;
  const sessionId =
    typeof rawSessionId === "string"
      ? rawSessionId
      : Array.isArray(rawSessionId)
        ? rawSessionId[0]
        : undefined;

  const selectCols =
    "plan_id, theme_ids, amount, created_at, stripe_session_id";

  let purchase: {
    plan_id: string;
    theme_ids: string[];
    amount: number;
    created_at: string;
    stripe_session_id: string | null;
  } | null = null;

  if (sessionId) {
    const { data } = await supabase
      .from("purchases")
      .select(selectCols)
      .eq("user_id", user.id)
      .eq("stripe_session_id", sessionId)
      .eq("status", "completed")
      .maybeSingle();
    purchase = data ?? null;
  }

  if (!purchase) {
    const { data } = await supabase
      .from("purchases")
      .select(selectCols)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    purchase = data ?? null;
  }

  // V1 scope-revert: filter to launched themes only. A DB anomaly or stale
  // pre-revert purchase row could otherwise surface a coming-soon theme as
  // owned, breaking the access-card render below.
  const purchasedThemeIds: string[] = (purchase?.theme_ids ?? []).filter(
    (slug: string) => isLaunched(slug),
  );
  const firstThemeSlug = purchasedThemeIds[0] ?? DEFAULT_THEME;
  const firstTheme = themes[firstThemeSlug];
  const firstThemeModules = firstTheme ? getModules(firstThemeSlug) : [];

  // Build the access-card rows (one per purchased theme) so we can
  // render a "Start Now" CTA for each.
  const accessThemes = purchasedThemeIds
    .map((slug) => ({ slug, manifest: themes[slug] }))
    .filter(
      (
        entry,
      ): entry is {
        slug: string;
        manifest: (typeof themes)[string];
      } => Boolean(entry.manifest),
    );

  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <AmbientBackground count={220} />
      <div className="max-w-3xl mx-auto px-6 py-20 relative z-10">
        {/* ── Hero ─────────────────────────────────── */}
        <div className="text-center mb-12">
          <div
            className="text-5xl mb-6"
            style={{
              color: firstTheme?.palette.primary ?? "var(--tc-primary)",
            }}
          >
            &#10003;
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold font-mono uppercase tracking-tight mb-4 text-text-primary">
            You&apos;re In
          </h1>
          <p className="text-base sm:text-lg text-text-muted max-w-xl mx-auto">
            {firstTheme
              ? `${firstTheme.displayName} is now fully unlocked. All ${firstThemeModules.length} modules are ready.`
              : "Your purchase is confirmed. All content is now unlocked."}
          </p>
        </div>

        {purchase && (
          <PurchaseAnalytics
            planId={purchase.plan_id}
            amount={purchase.amount}
          />
        )}

        {/* ── Access Card ──────────────────────────── */}
        {accessThemes.length > 0 && (
          <section
            aria-labelledby="access-card-heading"
            className="rounded-none border-2 border-border bg-surface-raised brutalist-shadow p-6 sm:p-8 mb-10"
          >
            <div className="flex items-baseline justify-between mb-6">
              <h2
                id="access-card-heading"
                className="text-xs font-semibold font-mono uppercase tracking-widest text-text-muted"
              >
                Access Granted
              </h2>
              <span className="text-xs font-mono text-text-muted">
                {accessThemes.length}
                {accessThemes.length === 1 ? " theme" : " themes"}
              </span>
            </div>
            <ul className="space-y-3">
              {accessThemes.map(({ slug, manifest }) => {
                const moduleCount = getModules(slug).length;
                return (
                  <li
                    key={slug}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border p-4 bg-page"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        aria-hidden="true"
                        className="inline-block w-3 h-3 shrink-0"
                        style={{ background: manifest.palette.primary }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-text-primary truncate">
                          {manifest.displayName}
                        </div>
                        <div className="text-xs font-mono text-text-muted">
                          {moduleCount} modules &middot; {slug}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/themes/${slug}`}
                      data-testid={`access-start-${slug}`}
                      className="inline-flex items-center justify-center h-11 px-5 text-sm font-medium font-mono rounded-none border-2 border-primary bg-primary text-page hover:bg-transparent hover:text-primary transition-colors brutalist-hover"
                    >
                      Start Now &rarr;
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ── Receipt ──────────────────────────────── */}
        {purchase && (
          <section
            aria-labelledby="receipt-heading"
            data-testid="purchase-receipt"
            className="rounded-none border-2 border-border bg-surface-raised p-6 sm:p-8 mb-10 font-mono"
          >
            <div className="flex items-baseline justify-between mb-5">
              <h2
                id="receipt-heading"
                className="text-xs font-semibold uppercase tracking-widest text-text-muted"
              >
                Receipt
              </h2>
              <span className="text-xs text-text-muted">
                TC-{shortenSessionId(purchase.stripe_session_id)}
              </span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between sm:block border-b sm:border-none border-border/50 pb-2 sm:pb-0">
                <dt className="text-xs uppercase tracking-wider text-text-muted">
                  Amount
                </dt>
                <dd
                  data-testid="receipt-amount"
                  className="text-text-primary sm:mt-1"
                >
                  {formatCurrency(purchase.amount)}
                </dd>
              </div>
              <div className="flex justify-between sm:block border-b sm:border-none border-border/50 pb-2 sm:pb-0">
                <dt className="text-xs uppercase tracking-wider text-text-muted">
                  Currency
                </dt>
                <dd className="text-text-primary sm:mt-1">USD</dd>
              </div>
              <div className="flex justify-between sm:block border-b sm:border-none border-border/50 pb-2 sm:pb-0">
                <dt className="text-xs uppercase tracking-wider text-text-muted">
                  Plan
                </dt>
                <dd className="text-text-primary sm:mt-1">
                  {purchase.plan_id}
                </dd>
              </div>
              <div className="flex justify-between sm:block border-b sm:border-none border-border/50 pb-2 sm:pb-0">
                <dt className="text-xs uppercase tracking-wider text-text-muted">
                  Date
                </dt>
                <dd
                  data-testid="receipt-date"
                  className="text-text-primary sm:mt-1"
                >
                  {formatReceiptDate(purchase.created_at)}
                </dd>
              </div>
              <div className="flex justify-between sm:block border-b sm:border-none border-border/50 pb-2 sm:pb-0 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-text-muted">
                  Themes
                </dt>
                <dd
                  data-testid="receipt-themes"
                  className="text-text-primary sm:mt-1 break-all"
                >
                  {purchase.theme_ids.length > 0
                    ? purchase.theme_ids.join(", ")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between sm:block sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-text-muted">
                  Session
                </dt>
                <dd
                  data-testid="receipt-session"
                  className="text-text-primary sm:mt-1"
                >
                  …{shortenSessionId(purchase.stripe_session_id)}
                </dd>
              </div>
            </dl>
            <p className="mt-6 pt-5 border-t border-border/50 text-xs text-text-muted">
              Lifetime access. No subscription. Keep this receipt for your
              records.
            </p>
          </section>
        )}

        {/* ── CTAs ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href={`/themes/${firstThemeSlug}`}
            data-testid="cta-first-lesson"
            className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-medium font-mono rounded-none border-2 border-primary bg-primary text-page hover:bg-transparent hover:text-primary transition-colors brutalist-hover brutalist-shadow"
          >
            Start your first lesson &rarr;
          </Link>
          <Link
            href="/themes"
            data-testid="cta-view-all-themes"
            className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-medium font-mono rounded-none border-2 border-border text-text-muted hover:text-text-primary hover:border-primary transition-colors brutalist-hover"
          >
            View all themes
          </Link>
        </div>
      </div>
    </main>
  );
}

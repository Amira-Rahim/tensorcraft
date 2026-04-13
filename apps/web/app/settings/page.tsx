import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_THEME } from "@tensorcraft/shared";
import { SettingsForm } from "./settings-form";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Tensorcraft",
  description: "Manage your Tensorcraft profile, preferences, and account.",
};

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, preferred_theme_id, github_username, github_connected, email_alerts, weekly_digest",
    )
    .eq("id", user.id)
    .single();

  // Fetch completed purchases
  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("plan_id, theme_ids, amount, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const purchases = (purchaseRows ?? []).map((p) => ({
    planId: p.plan_id,
    themeIds: p.theme_ids,
    amount: p.amount,
    createdAt: p.created_at,
  }));

  const profileRecord = profile as Record<string, unknown> | null;

  return (
    <main className="min-h-screen bg-surface relative overflow-hidden">
      <AmbientBackground count={160} />
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="max-w-[1000px] mx-auto px-8 py-10 relative z-10">
        <SettingsForm
          email={user.email ?? ""}
          displayName={profile?.display_name ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
          preferredThemeId={
            (profileRecord?.preferred_theme_id as string) ?? DEFAULT_THEME
          }
          githubUsername={(profileRecord?.github_username as string) ?? ""}
          githubConnected={
            (profileRecord?.github_connected as boolean) ?? false
          }
          emailAlerts={(profileRecord?.email_alerts as boolean) ?? false}
          weeklyDigest={(profileRecord?.weekly_digest as boolean) ?? true}
          purchases={purchases}
        />
      </div>
    </main>
  );
}

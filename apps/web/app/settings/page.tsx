import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { SettingsForm } from "./settings-form";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Tensorcraft",
  description: "Manage your Tensorcraft profile, preferences, and account.",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Note: `preferred_world_id` is no longer read or rendered. The column is
  // kept on the table as a tombstone so a future re-introduction of world
  // preference doesn't require a destructive migration.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, avatar_url, github_username, github_connected, email_alerts, weekly_digest",
    )
    .eq("id", user.id)
    .single();

  // Fetch completed purchases
  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("plan_id, world_ids, amount, created_at")
    .eq("user_id", user.id)
    .in("status", ["completed", "partially_refunded"])
    .order("created_at", { ascending: false });

  const purchases = (purchaseRows ?? []).map((p) => ({
    planId: p.plan_id,
    worldIds: p.world_ids,
    amount: p.amount,
    createdAt: p.created_at,
  }));

  const profileRecord = profile as Record<string, unknown> | null;

  return (
    <main className="min-h-screen bg-page relative overflow-hidden">
      <AmbientBackground count={160} />
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-10 relative z-10">
        <SettingsForm
          email={user.email ?? ""}
          displayName={profile?.display_name ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
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

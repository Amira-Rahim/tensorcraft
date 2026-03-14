import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // preferred_theme_id may not exist yet (added in migration 002)
  const profileRecord = profile as Record<string, unknown> | null;

  return (
    <main className="min-h-screen bg-surface relative overflow-hidden">
      <AmbientBackground count={160} />
      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <h1 className="text-2xl font-bold mb-8 text-text-primary font-mono">
          Settings
        </h1>

        <SettingsForm
          email={user.email ?? ""}
          displayName={profile?.display_name ?? ""}
          avatarUrl={profile?.avatar_url ?? ""}
          preferredThemeId={
            (profileRecord?.preferred_theme_id as string) ?? "deep-orbit"
          }
        />
      </div>
    </main>
  );
}

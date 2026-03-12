import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
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
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1
          className="text-2xl font-bold mb-8"
          style={{ color: "var(--tc-text, #FFFFFF)" }}
        >
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

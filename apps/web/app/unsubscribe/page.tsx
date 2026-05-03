import type { Metadata } from "next";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

export const metadata: Metadata = {
  title: "Unsubscribe — Tensorcraft",
  robots: { index: false, follow: false },
};

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("waitlist")
    .update({ subscribed: false })
    .eq("unsubscribe_token", token)
    .select("id");
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;
  const ok = token ? await unsubscribeByToken(token) : false;

  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="mb-4 text-3xl font-bold">
        {ok ? "Unsubscribed." : "Couldn't unsubscribe."}
      </h1>
      <p className="text-text-muted">
        {ok
          ? "You won't get The Bridge anymore. If this was a mistake, reply to any past email and we'll re-add you."
          : "Token missing or already used. If you're still getting emails, reply to one and we'll handle it manually."}
      </p>
    </main>
  );
}

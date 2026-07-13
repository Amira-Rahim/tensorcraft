import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

export const metadata: Metadata = {
  title: "Unsubscribe | Tensorcraft",
  robots: { index: false, follow: false },
};

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string; done?: string }>;
}

// The GET render must never write: corporate mail scanners and link
// prefetchers GET every URL in an email, and an unsubscribe-on-load page
// silently removes recipients whose mail gateway opened the link
// (2026-07-13 P4 round-3 audit). Humans confirm via the form POST below;
// mail providers use the RFC 8058 one-click POST route instead.
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

async function confirmUnsubscribe(formData: FormData) {
  "use server";
  const token = formData.get("token");
  const ok = typeof token === "string" && (await unsubscribeByToken(token));
  redirect(`/unsubscribe?done=${ok ? "1" : "0"}`);
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token, done } = await searchParams;

  if (done === "1") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="mb-4 text-3xl font-bold">Unsubscribed.</h1>
        <p className="text-text-muted">
          You won&apos;t get The Bridge anymore. If this was a mistake, reply to
          any past email and we&apos;ll re-add you.
        </p>
      </main>
    );
  }

  if (done === "0" || !token) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="mb-4 text-3xl font-bold">Couldn&apos;t unsubscribe.</h1>
        <p className="text-text-muted">
          We couldn&apos;t match that unsubscribe link. If you&apos;re still
          getting emails, reply to one and we&apos;ll handle it manually.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="mb-4 text-3xl font-bold">Unsubscribe from The Bridge?</h1>
      <p className="mb-8 text-text-muted">
        One click and the weekly digest stops. We ask first because email
        scanners open links on your behalf.
      </p>
      <form action={confirmUnsubscribe}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="border border-border bg-surface-raised px-6 py-3 font-mono text-sm uppercase tracking-widest hover:bg-code-bg"
        >
          Unsubscribe
        </button>
      </form>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { InboxView, type InboxMessage } from "./inbox-view";

export const metadata: Metadata = {
  title: "DISPATCH inbox | Tensorcraft",
  description: "Operator messages from DISPATCH — weekly intel and milestones.",
  robots: { index: false, follow: false },
};

export default async function InboxPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirectTo=/inbox");

  const { data: rows } = await supabase
    .from("dispatch_messages")
    .select(
      "id, kind, subject, body_mdx, cta_label, cta_href, sent_at, read_at",
    )
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(100);

  const messages: InboxMessage[] = (rows ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    subject: r.subject,
    bodyMdx: r.body_mdx,
    ctaLabel: r.cta_label,
    ctaHref: r.cta_href,
    sentAt: r.sent_at,
    readAt: r.read_at,
  }));

  return <InboxView messages={messages} />;
}

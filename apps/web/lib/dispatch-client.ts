"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

export interface DispatchMessage {
  id: string;
  kind: "weekly_intel" | "milestone" | "cliffhanger";
  subject: string;
  bodyMdx: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  sentAt: string;
  readAt: string | null;
}

/** Fetches the unread count for the nav-bar badge. Server-driven via RPC. */
export async function getUnreadDispatchCount(): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase.rpc("count_unread_dispatch");
  if (error || data === null) return 0;
  return Number(data);
}

/** Mark a single message as read. No-op for already-read messages. */
export async function markDispatchRead(messageId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.rpc("mark_dispatch_read", { p_message_id: messageId });
}

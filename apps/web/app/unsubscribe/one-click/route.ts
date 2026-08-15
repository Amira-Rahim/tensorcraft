import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";

/**
 * RFC 8058 One-Click unsubscribe target. The digest's List-Unsubscribe
 * header points here: mail providers POST (no body contract beyond the
 * List-Unsubscribe=One-Click form field) and expect a 2xx with no
 * confirmation step. The human-facing /unsubscribe PAGE cannot serve
 * this - app-router pages answer GET only, so provider POSTs were
 * bouncing 405 while the header promised one-click support
 * (2026-07-13 P4 round-3 audit).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("waitlist")
    .update({ subscribed: false })
    .eq("unsubscribe_token", token);
  if (error) {
    return NextResponse.json({ error: "unsubscribe failed" }, { status: 500 });
  }
  // No matched-row check: RFC 8058 wants an idempotent 2xx, and providers
  // retry on non-2xx. A token that matches nothing (already-unsubscribed,
  // deleted row) still gets ok:true; only a real DB error is a 500.
  return NextResponse.json({ ok: true });
}

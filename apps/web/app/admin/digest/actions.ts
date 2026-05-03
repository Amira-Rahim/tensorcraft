"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient, isAdmin } from "@tensorcraft/supabase";
import { isoWeek } from "@/lib/iso-week";

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user.id))) {
    throw new Error("Forbidden");
  }
  return user.id;
}

export async function setNewsItemStatus(
  id: string,
  status: "pending" | "shortlisted" | "rejected",
) {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const update: Record<string, unknown> = {
    status,
    curated_at: new Date().toISOString(),
  };
  if (status === "shortlisted") {
    update.week_iso = isoWeek();
  }
  const { error } = await admin.from("news_items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/digest");
}

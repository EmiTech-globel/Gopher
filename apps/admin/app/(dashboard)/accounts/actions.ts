"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adjustTrustTier(profileId: string, tier: "new" | "trusted") {
  const supabase = await createClient();
  const { error } = await supabase.from("scouts").update({ trust_tier: tier }).eq("profile_id", profileId);
  if (error) return { error: error.message };
  revalidatePath(`/accounts/${profileId}`);
  return { error: null };
}

export async function banScout(profileId: string, reason: string) {
  const supabase = await createClient();

  // 3-5 day mercy period per spec Section 11 — using 5 (the upper
  // bound) so a scout is never cut off from appealing sooner than the
  // policy promises.
  const mercyPeriodEnds = new Date();
  mercyPeriodEnds.setDate(mercyPeriodEnds.getDate() + 5);

  const { error } = await supabase
    .from("scouts")
    .update({
      banned_at: new Date().toISOString(),
      ban_reason: reason,
      mercy_period_ends_at: mercyPeriodEnds.toISOString(),
    })
    .eq("profile_id", profileId);

  if (error) return { error: error.message };
  revalidatePath(`/accounts/${profileId}`);
  return { error: null };
}

export async function unbanScout(profileId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scouts")
    .update({ banned_at: null, ban_reason: null, mercy_period_ends_at: null })
    .eq("profile_id", profileId);

  if (error) return { error: error.message };
  revalidatePath(`/accounts/${profileId}`);
  return { error: null };
}

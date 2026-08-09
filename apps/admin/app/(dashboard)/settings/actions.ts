"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SettingsInput {
  chargesFeePercent: number;
  newScoutValueCap: number;
  trustTierThreshold: number;
  resubmissionLimit: number;
}

export async function updatePlatformSettings(input: SettingsInput) {
  if (input.chargesFeePercent < 0 || input.chargesFeePercent > 100) {
    return { error: "Charges Fee percent must be between 0 and 100." };
  }
  if (input.newScoutValueCap < 0) {
    return { error: "Order value cap can't be negative." };
  }
  if (!Number.isInteger(input.trustTierThreshold) || input.trustTierThreshold < 1) {
    return { error: "Trust-tier threshold must be a whole number of at least 1." };
  }
  if (!Number.isInteger(input.resubmissionLimit) || input.resubmissionLimit < 1) {
    return { error: "Resubmission limit must be a whole number of at least 1." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      charges_fee_percent: input.chargesFeePercent,
      new_scout_value_cap: input.newScoutValueCap,
      trust_tier_threshold: input.trustTierThreshold,
      resubmission_limit: input.resubmissionLimit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { error: null };
}

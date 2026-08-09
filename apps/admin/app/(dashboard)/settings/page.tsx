import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("platform_settings")
    .select("charges_fee_percent, new_scout_value_cap, trust_tier_threshold, resubmission_limit")
    .eq("id", 1)
    .single();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Settings</h1>
      <p className="mb-6 text-sm text-muted">
        These four values are read live by the mobile app and by database triggers —
        changes here take effect immediately, no deploy required.
      </p>

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn&apos;t load settings: {error.message}
        </p>
      )}

      {settings && (
        <SettingsForm
          initial={{
            chargesFeePercent: Number(settings.charges_fee_percent),
            newScoutValueCap: Number(settings.new_scout_value_cap),
            trustTierThreshold: settings.trust_tier_threshold,
            resubmissionLimit: settings.resubmission_limit,
          }}
        />
      )}
    </div>
  );
}

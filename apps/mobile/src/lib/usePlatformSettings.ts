import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface PlatformSettings {
  chargesFeePercent: number;
  newScoutValueCap: number;
  trustTierThreshold: number;
  resubmissionLimit: number;
}

// Mirrors platform_settings' column defaults (migration 00033) so
// there's no flash of a wrong value while the fetch is in flight —
// these are only ever shown before the real row loads.
const DEFAULTS: PlatformSettings = {
  chargesFeePercent: 18,
  newScoutValueCap: 2000,
  trustTierThreshold: 3,
  resubmissionLimit: 3,
};

/**
 * Spec Section 13 promises these four values are admin-adjustable
 * "without touching code" — this hook is what makes that real for the
 * mobile app, replacing what used to be hardcoded constants
 * (NEW_SCOUT_VALUE_CAP, RESUBMISSION_LIMIT) scattered across screens.
 */
export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("platform_settings")
        .select("charges_fee_percent, new_scout_value_cap, trust_tier_threshold, resubmission_limit")
        .eq("id", 1)
        .single();

      if (cancelled || !data) return;
      setSettings({
        chargesFeePercent: Number(data.charges_fee_percent),
        newScoutValueCap: Number(data.new_scout_value_cap),
        trustTierThreshold: data.trust_tier_threshold,
        resubmissionLimit: data.resubmission_limit,
      });
      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { settings, loaded };
}

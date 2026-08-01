import { supabase } from "./supabase";

export async function getCounterpartPhone(errandId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_counterpart_phone", { target_errand_id: errandId });
  if (error) {
    console.error("Failed to fetch counterpart phone", error);
    return null;
  }
  return data;
}

export async function revealMyPhone(errandId: string): Promise<void> {
  const { error } = await supabase.rpc("reveal_my_phone", { target_errand_id: errandId });
  if (error) console.error("Failed to reveal phone", error);
}

// Call once when chat becomes available (errand status !== "open"). If
// the caller's own default preference is on, this auto-reveals for this
// errand without requiring a manual tap — matches "reveal by default"
// meaning something real instead of just sitting in a settings screen.
export async function autoRevealIfDefaultOn(errandId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("reveal_phone_by_default")
    .eq("id", user.id)
    .single();

  if (profile?.reveal_phone_by_default) {
    await revealMyPhone(errandId);
  }
}
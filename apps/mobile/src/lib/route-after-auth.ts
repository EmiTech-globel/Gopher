import { router } from "expo-router";
import { supabase } from "./supabase";

/**
 * Decides where to send a user right after a session is established
 * (login, or completing signup) — based on whether a scouts row exists
 * for their profile, and if so, its verification_status. Two separate
 * signup flows (create-account vs scout-registration) mean this is a
 * reliable, permanent role signal.
 */
export async function routeAfterAuth() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/login");
    return;
  }

  const { data: scoutRow } = await supabase
    .from("scouts")
    .select("profile_id, verification_status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!scoutRow) {
    router.replace("/(user)/home");
    return;
  }

  if (scoutRow.verification_status === "approved") {
    router.replace("/(scout)/home");
    return;
  }

  if (scoutRow.verification_status === "rejected") {
    router.replace("/verification-rejected");
    return;
  }

  // pending, or any other in-between status
  router.replace("/verification-pending");
}
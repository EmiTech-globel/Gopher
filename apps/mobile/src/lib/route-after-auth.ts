import { router } from "expo-router";
import { supabase } from "./supabase";
import { TERMS_VERSION } from "./terms";

/**
 * Decides where to send a user right after a session is established
 * (login, or completing signup) — based on whether a scouts row exists
 * for their profile, and if so, its verification_status. Two separate
 * signup flows (create-account vs scout-registration) mean this is a
 * reliable, permanent role signal.
 *
 * Terms & Conditions acceptance is checked first, ahead of role
 * routing: any user whose profiles.terms_version doesn't match the
 * app's current TERMS_VERSION (never accepted, or accepted an older
 * version) is sent to /terms-and-conditions with no `next` param —
 * that screen re-runs routeAfterAuth() once they accept, so it always
 * lands them where this function would have sent them anyway.
 */
export async function routeAfterAuth() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/login");
    return;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("terms_version")
    .eq("id", user.id)
    .maybeSingle();

  if (profileRow?.terms_version !== TERMS_VERSION) {
    router.replace("/terms-and-conditions");
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
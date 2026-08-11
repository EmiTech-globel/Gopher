"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Both revoke/restore below escalate to the service-role client,
 * which bypasses RLS entirely — proxy.ts already gates every
 * dashboard page behind an admins-table check, but a Server Action
 * is technically its own callable endpoint, so this re-verifies the
 * caller is actually an admin before touching the privileged client
 * rather than relying solely on the page-level gate.
 */
async function assertIsAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("id").eq("id", user.id).maybeSingle();
  return !!data;
}

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

/**
 * Real access revocation — works for any account, User or Scout,
 * unlike banScout above which only ever touched the scouts table.
 * Enforcement is Supabase Auth's own ban_duration on auth.users
 * (GoTrue checks this on every sign-in attempt, including from a
 * fresh device with no client-side state to bypass), not a flag this
 * app has to remember to check itself.
 *
 * Deliberately does not call auth.admin.deleteUser — profiles.id
 * cascades from auth.users, so a real delete would wipe the scout's
 * archived selfie/ID along with it, defeating the anti-re-registration
 * safeguard spec Section 11 explicitly requires survive a "deletion."
 *
 * Known limitation: this blocks new sign-ins immediately, but an
 * already-active session's access token remains valid until its
 * normal expiry (Supabase's default is 1 hour) — there's no
 * straightforward admin-API call to instantly kill a specific user's
 * live session by ID. Acceptable for this use case; worth knowing if
 * "immediate" ever needs to mean literally instant.
 */
export async function revokeAccountAccess(profileId: string, reason: string) {
  if (!(await assertIsAdmin())) return { error: "Not authorized" };
  if (!reason.trim()) return { error: "A reason is required." };

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(profileId, {
    ban_duration: "87600h", // ~10 years — Supabase has no literal "permanent", this is the practical equivalent
  });
  if (authError) return { error: authError.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ access_revoked_at: new Date().toISOString(), access_revoked_reason: reason })
    .eq("id", profileId);

  if (error) return { error: `Access revoked, but couldn't update the record: ${error.message}` };

  revalidatePath(`/accounts/${profileId}`);
  revalidatePath("/accounts");
  return { error: null };
}

export async function restoreAccountAccess(profileId: string) {
  if (!(await assertIsAdmin())) return { error: "Not authorized" };

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(profileId, {
    ban_duration: "none",
  });
  if (authError) return { error: authError.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ access_revoked_at: null, access_revoked_reason: null })
    .eq("id", profileId);

  if (error) return { error: `Access restored, but couldn't update the record: ${error.message}` };

  revalidatePath(`/accounts/${profileId}`);
  revalidatePath("/accounts");
  return { error: null };
}

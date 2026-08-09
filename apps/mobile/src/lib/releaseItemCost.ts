import { supabase } from "./supabase";

/**
 * Fires after a scout's own accept action, or a requester's own
 * confirm action — the edge function itself decides server-side
 * whether anything should actually happen (trusted-tier release on
 * accept, new-tier reimbursement on confirm), so this is safe to call
 * unconditionally from both places without the client needing to know
 * which case applies.
 *
 * Deliberately non-throwing on failure — the errand's status change
 * (accept/confirm) has already succeeded by the time this runs, so a
 * payout failure shouldn't be presented as if the whole action failed.
 * Callers surface the warning through their own themed alert instead
 * of letting this throw and derail an already-successful flow.
 */
export async function releaseItemCostIfApplicable(errandId: string): Promise<{ warning: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { warning: null };

    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/release-item-cost`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ errandId }),
    });

    const data = await response.json();

    if (!response.ok && data.error) {
      return { warning: data.error as string };
    }
    return { warning: null };
  } catch {
    return { warning: "Couldn't reach the payment service. Item-cost may need manual review." };
  }
}

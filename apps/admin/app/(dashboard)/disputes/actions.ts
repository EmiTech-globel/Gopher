"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

type Resolution = "release_to_scout" | "refund_to_requester" | "partial_split" | "escalate";

interface ResolveDisputeInput {
  disputeId: string;
  errandId: string;
  resolution: Resolution;
  banScout: boolean;
}

/**
 * Refunds only item_budget + delivery_fee, never processing_fee — the
 * processing fee is non-refundable in every cancellation/dispute
 * scenario per spec Section 9's table, a deliberate business policy,
 * not just a Paystack technical limitation. Passes an explicit amount
 * to Paystack's refund endpoint rather than omitting it (which would
 * refund the full original charge, including the fee).
 */
async function refundViaPaystack(reference: string, amountKobo: number) {
  const response = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction: reference, amount: amountKobo }),
  });

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(json.message ?? "Paystack refund request failed");
  }
  return json;
}

export async function resolveDispute(input: ResolveDisputeInput) {
  const supabase = await createClient();

  const { data: errand, error: errandError } = await supabase
    .from("errands")
    .select("id, item_budget, delivery_fee, scout_id")
    .eq("id", input.errandId)
    .single();

  if (errandError || !errand) {
    return { error: errandError?.message ?? "Errand not found" };
  }

  const needsRefund = input.resolution === "refund_to_requester" || input.resolution === "escalate";

  if (needsRefund) {
    const { data: paymentTxn } = await supabase
      .from("transactions")
      .select("paystack_reference")
      .eq("errand_id", input.errandId)
      .eq("type", "payment_in")
      .eq("status", "success")
      .maybeSingle();

    if (!paymentTxn?.paystack_reference) {
      return { error: "No successful payment_in transaction found for this errand — can't refund." };
    }

    const refundAmount = Math.round((Number(errand.item_budget) + Number(errand.delivery_fee)) * 100);

    try {
      await refundViaPaystack(paymentTxn.paystack_reference, refundAmount);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Refund failed" };
    }

    // Paystack refunds are asynchronous (3-10 working days per spec
    // Section 10) — this records that Gopher initiated it, not that
    // funds have landed. status stays 'success' meaning "request
    // accepted by Paystack," matching the pattern of every other
    // transaction row in this table (they record API-call outcomes,
    // not eventual settlement).
    await supabase.from("transactions").insert({
      errand_id: input.errandId,
      type: "refund",
      amount: refundAmount / 100,
      paystack_reference: paymentTxn.paystack_reference,
      status: "success",
    });
  }

  const newErrandStatus = input.resolution === "release_to_scout" || input.resolution === "partial_split"
    ? "confirmed"
    : "cancelled";

  const { error: errandUpdateError } = await supabase
    .from("errands")
    .update({
      status: newErrandStatus,
      ...(newErrandStatus === "confirmed" ? { confirmed_at: new Date().toISOString() } : {}),
      ...(newErrandStatus === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
    })
    .eq("id", input.errandId);

  if (errandUpdateError) {
    return { error: `Refund processed, but couldn't update errand status: ${errandUpdateError.message}` };
  }

  const { error: disputeUpdateError } = await supabase
    .from("disputes")
    .update({
      status: "resolved",
      resolution: input.resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.disputeId);

  if (disputeUpdateError) {
    return { error: `Errand updated, but couldn't mark dispute resolved: ${disputeUpdateError.message}` };
  }

  if (input.banScout && errand.scout_id) {
    await supabase
      .from("scouts")
      .update({ banned_at: new Date().toISOString(), ban_reason: `Dispute resolved as: ${input.resolution}` })
      .eq("profile_id", errand.scout_id);
  }

  revalidatePath("/disputes");
  return { error: null };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function generateBatchesNow() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_weekly_payout_batches");
  if (error) return { error: error.message };
  revalidatePath("/payouts");
  return { error: null };
}

/**
 * Sends the actual Commission for a batch via Paystack's Transfer API.
 * This is the piece that was never built anywhere in the codebase —
 * the weekly cron only ever created payout_batches rows with
 * status='pending'; nothing before this ever moved real money to a
 * scout's bank account.
 *
 * Paystack can respond with status "otp" if the business account has
 * OTP finalization enabled for transfers — that requires a second call
 * to /transfer/finalize_transfer with a code sent to the account's
 * registered phone, which has no UI here yet. Surfaced as a clear
 * error rather than silently treated as success.
 */
export async function sendBatchTransfer(batchId: string) {
  const supabase = await createClient();

  const { data: batch, error: batchError } = await supabase
    .from("payout_batches")
    .select("id, scout_id, total_amount, status")
    .eq("id", batchId)
    .single();

  if (batchError || !batch) return { error: batchError?.message ?? "Batch not found" };
  if (batch.status === "paid") return { error: "This batch has already been paid." };
  if (Number(batch.total_amount) <= 0) return { error: "Batch total is ₦0 — nothing to send." };

  const { data: scout } = await supabase
    .from("scouts")
    .select("paystack_recipient_code")
    .eq("profile_id", batch.scout_id)
    .single();

  if (!scout?.paystack_recipient_code) {
    return { error: "This scout hasn't set up bank details yet — no transfer recipient on file." };
  }

  const response = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(Number(batch.total_amount) * 100),
      recipient: scout.paystack_recipient_code,
      reason: "Gopher weekly Commission payout",
    }),
  });

  const json = await response.json();

  if (!response.ok || !json.status) {
    return { error: json.message ?? "Paystack transfer request failed" };
  }

  if (json.data?.status === "otp") {
    return {
      error: "Paystack requires OTP finalization for transfers on this account (not yet supported here) — finalize this transfer directly in the Paystack dashboard instead.",
    };
  }

  const { error: updateError } = await supabase
    .from("payout_batches")
    .update({
      status: "paid",
      paystack_transfer_reference: json.data?.transfer_code ?? json.data?.reference ?? null,
    })
    .eq("id", batchId);

  if (updateError) {
    return { error: `Transfer sent, but couldn't update the batch record: ${updateError.message}` };
  }

  revalidatePath("/payouts");
  return { error: null };
}

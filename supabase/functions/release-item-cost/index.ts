import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Item-cost money flow (spec Section 5) — distinct from Commission,
 * which is handled entirely separately by the weekly payout batch
 * cron (00016/00033). This is the piece that was never built at all:
 *
 *   - Trusted-tier scout accepts an errand -> item-cost releases
 *     immediately, so the scout never has to spend their own money.
 *   - New-tier scout gets delivery confirmed -> item-cost they
 *     already fronted gets reimbursed.
 *
 * Called from two different client screens after two different
 * actions (scout's own accept action; requester's own confirm
 * action) — rather than trusting the client to say which case
 * applies, this always re-derives the correct action server-side
 * from the errand's actual status and the scout's actual trust_tier,
 * and no-ops harmlessly if neither condition is met yet. Idempotent:
 * refuses to pay twice for the same errand.
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  const { errandId } = await req.json();
  if (!errandId) {
    return new Response(JSON.stringify({ error: "Missing errandId" }), { status: 400 });
  }

  const { data: errand, error: errandError } = await supabase
    .from("errands")
    .select("id, scout_id, requester_id, status, item_budget")
    .eq("id", errandId)
    .single();

  if (errandError || !errand) {
    return new Response(JSON.stringify({ error: "Errand not found" }), { status: 404 });
  }

  // Called from either side depending on which action triggered it —
  // the scout's own accept, or the requester's own confirm.
  if (user.id !== errand.scout_id && user.id !== errand.requester_id) {
    return new Response(JSON.stringify({ error: "Not a party to this errand" }), { status: 403 });
  }

  if (!errand.scout_id) {
    return new Response(JSON.stringify({ skipped: true, reason: "No scout assigned yet" }), { status: 200 });
  }

  const { data: scout } = await supabase
    .from("scouts")
    .select("trust_tier, paystack_recipient_code")
    .eq("profile_id", errand.scout_id)
    .single();

  if (!scout) {
    return new Response(JSON.stringify({ error: "Scout record not found" }), { status: 404 });
  }

  const shouldRelease =
    (errand.status === "accepted" && scout.trust_tier === "trusted") ||
    (errand.status === "confirmed" && scout.trust_tier === "new");

  if (!shouldRelease) {
    return new Response(
      JSON.stringify({ skipped: true, reason: `No item-cost action for status=${errand.status}, tier=${scout.trust_tier}` }),
      { status: 200 }
    );
  }

  // Idempotency guard — refuses to pay twice for the same errand even
  // if this gets called more than once (client retry, both accept and
  // a later confirm both firing it, etc).
  const { data: existingPayout } = await supabase
    .from("transactions")
    .select("id")
    .eq("errand_id", errandId)
    .eq("type", "item_cost_payout")
    .maybeSingle();

  if (existingPayout) {
    return new Response(JSON.stringify({ skipped: true, reason: "Already paid" }), { status: 200 });
  }

  if (!scout.paystack_recipient_code) {
    return new Response(
      JSON.stringify({ error: "Scout hasn't set up bank details yet — no transfer recipient on file." }),
      { status: 400 }
    );
  }

  const amountKobo = Math.round(Number(errand.item_budget) * 100);

  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountKobo,
      recipient: scout.paystack_recipient_code,
      reason: errand.status === "accepted" ? "Gopher item-cost advance" : "Gopher item-cost reimbursement",
    }),
  });

  const transferData = await transferRes.json();

  if (!transferRes.ok || !transferData.status) {
    return new Response(
      JSON.stringify({ error: transferData.message ?? "Paystack transfer request failed" }),
      { status: 502 }
    );
  }

  if (transferData.data?.status === "otp") {
    return new Response(
      JSON.stringify({ error: "Paystack requires OTP finalization for transfers on this account — finalize directly in the Paystack dashboard." }),
      { status: 502 }
    );
  }

  await supabase.from("transactions").insert({
    errand_id: errandId,
    type: "item_cost_payout",
    amount: errand.item_budget,
    paystack_reference: transferData.data?.transfer_code ?? transferData.data?.reference ?? null,
    status: "success",
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

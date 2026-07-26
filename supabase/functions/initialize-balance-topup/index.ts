import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  const { balance_request_id } = await req.json();
  if (!balance_request_id) {
    return new Response(JSON.stringify({ error: "Missing balance_request_id" }), { status: 400 });
  }

  const { data: balanceRequest, error: brError } = await supabase
    .from("balance_requests")
    .select("id, errand_id, requested_amount, status")
    .eq("id", balance_request_id)
    .single();

  if (brError || !balanceRequest) {
    return new Response(JSON.stringify({ error: "Balance request not found" }), { status: 404 });
  }
  if (balanceRequest.status !== "pending") {
    return new Response(JSON.stringify({ error: "This request has already been resolved" }), { status: 409 });
  }

  const { data: errand, error: errandError } = await supabase
    .from("errands")
    .select("requester_id")
    .eq("id", balanceRequest.errand_id)
    .single();

  if (errandError || !errand || errand.requester_id !== user.id) {
    return new Response(JSON.stringify({ error: "Not authorized for this errand" }), { status: 403 });
  }

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();
  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
  }

  const reference = `gopher_topup_${crypto.randomUUID()}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: profile.email,
      amount: Math.round(balanceRequest.requested_amount * 100),
      reference,
      metadata: {
        balance_request_id: balanceRequest.id,
        errand_id: balanceRequest.errand_id,
        requested_amount: balanceRequest.requested_amount,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return new Response(JSON.stringify({ error: paystackData.message ?? "Paystack error" }), { status: 502 });
  }

  return new Response(
    JSON.stringify({ authorization_url: paystackData.data.authorization_url, reference }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
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

  const { account_number, bank_code, account_name } = await req.json();
  if (!account_number || !bank_code || !account_name) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const paystackRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: account_name,
      account_number,
      bank_code,
      currency: "NGN",
    }),
  });

  const data = await paystackRes.json();

  // Deliberately not throwing on failure here — Transfers may be gated
  // behind CAC business verification (Starter Business limitation). The
  // caller still saves bank_account_details regardless of this result;
  // this only updates paystack_recipient_code if it actually succeeds.
  if (!data.status) {
    return new Response(
      JSON.stringify({ recipient_code: null, warning: data.message ?? "Recipient creation not available yet" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }

  const recipientCode = data.data.recipient_code;

  await supabase.from("scouts").update({ paystack_recipient_code: recipientCode }).eq("profile_id", user.id);

  return new Response(JSON.stringify({ recipient_code: recipientCode }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
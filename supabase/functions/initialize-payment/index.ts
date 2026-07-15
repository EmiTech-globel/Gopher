import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface InitializePaymentBody {
  item_description: string;
  pickup_location: string;
  dropoff_location: string;
  item_budget: number;
  delivery_fee: number;
}

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
  }

  const body: InitializePaymentBody = await req.json();
  const { item_description, pickup_location, dropoff_location, item_budget, delivery_fee } = body;

  if (!item_description || !pickup_location || !dropoff_location || !item_budget || !delivery_fee) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  // Gross amount before Paystack's own collection fee — the fee itself is
  // meant to be added on top at checkout via the dashboard's "customer
  // bears the fee" setting (Section 6). CONFIRM that setting is actually
  // enabled in your Paystack dashboard (Settings > Preferences) — if it's
  // off, Gopher absorbs the fee silently instead of passing it through.
  const grossAmount = item_budget + delivery_fee;
  const reference = `gopher_${crypto.randomUUID()}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: profile.email,
      amount: Math.round(grossAmount * 100), // Paystack expects kobo
      reference,
      metadata: {
        requester_id: user.id,
        item_description,
        pickup_location,
        dropoff_location,
        item_budget,
        delivery_fee,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return new Response(JSON.stringify({ error: paystackData.message ?? "Paystack error" }), {
      status: 502,
    });
  }

  return new Response(
    JSON.stringify({ authorization_url: paystackData.data.authorization_url, reference }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === signature;
}

serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const isValid = await verifySignature(rawBody, signature);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { reference, metadata, amount } = event.data;

    // Idempotency: Paystack can deliver the same webhook more than once.
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (existing) {
      return new Response("Already processed", { status: 200 });
    }

    const { data: errand, error: errandError } = await supabase
      .from("errands")
      .insert({
        requester_id: metadata.requester_id,
        item_description: metadata.item_description,
        pickup_location: metadata.pickup_location,
        dropoff_location: metadata.dropoff_location,
        item_budget: metadata.item_budget,
        delivery_fee: metadata.delivery_fee,
        processing_fee: amount / 100 - (metadata.item_budget + metadata.delivery_fee),
        status: "open",
      })
      .select()
      .single();

    if (errandError || !errand) {
      console.error("Failed to create errand after payment", errandError);
      return new Response("Errand creation failed", { status: 500 });
    }

    await supabase.from("transactions").insert({
      errand_id: errand.id,
      type: "payment_in",
      amount: amount / 100,
      paystack_reference: reference,
      status: "success",
    });
  }

  return new Response("OK", { status: 200 });
});
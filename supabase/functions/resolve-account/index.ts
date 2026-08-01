import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { account_number, bank_code } = await req.json();
  if (!account_number || !bank_code) {
    return new Response(JSON.stringify({ error: "Missing account_number or bank_code" }), { status: 400 });
  }

  const paystackRes = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
  );

  const data = await paystackRes.json();

  if (!data.status) {
    return new Response(JSON.stringify({ error: data.message ?? "Couldn't verify account" }), { status: 502 });
  }

  return new Response(
    JSON.stringify({ account_name: data.data.account_name, account_number: data.data.account_number }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
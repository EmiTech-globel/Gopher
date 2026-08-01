import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const paystackRes = await fetch("https://api.paystack.co/bank?country=nigeria", {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });

  const data = await paystackRes.json();

  if (!data.status) {
    return new Response(JSON.stringify({ error: data.message ?? "Couldn't fetch banks" }), { status: 502 });
  }

  const banks = (data.data ?? []).map((b: { name: string; code: string }) => ({
    name: b.name,
    code: b.code,
  }));

  return new Response(JSON.stringify({ banks }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
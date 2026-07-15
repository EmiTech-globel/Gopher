import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

interface PostErrandPaymentInput {
  item_description: string;
  pickup_location: string;
  dropoff_location: string;
  item_budget: number;
  delivery_fee: number;
}

export async function initiateErrandPayment(input: PostErrandPaymentInput) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/initialize-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Payment initialization failed");

  // In-app browser for checkout. We don't treat this call's resolution as
  // payment confirmation — only the webhook creates the errand row.
  await WebBrowser.openAuthSessionAsync(data.authorization_url);

  return data.reference;
}
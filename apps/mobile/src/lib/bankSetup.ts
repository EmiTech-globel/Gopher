import { supabase } from "./supabase";

export interface Bank {
  name: string;
  code: string;
}

export async function fetchBanks(): Promise<Bank[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/list-banks`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Couldn't load banks");

  // Paystack's bank list can include duplicate `code` entries (same bank
  // appearing under different channel types). Dedupe by code so the
  // picker's keyExtractor never sees two items with an identical key.
  const seen = new Set<string>();
  const uniqueBanks: Bank[] = [];
  for (const bank of data.banks as Bank[]) {
    if (!seen.has(bank.code)) {
      seen.add(bank.code);
      uniqueBanks.push(bank);
    }
  }

  return uniqueBanks;
}

export async function resolveAccount(accountNumber: string, bankCode: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/resolve-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Couldn't verify account");
  return data as { account_name: string; account_number: string };
}

export async function createTransferRecipient(accountNumber: string, bankCode: string, accountName: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-transfer-recipient`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode, account_name: accountName }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Couldn't create transfer recipient");
  return data as { recipient_code: string | null; warning?: string };
}
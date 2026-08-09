"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "payment_in", label: "Payment in" },
  { value: "item_cost_payout", label: "Item cost payout" },
  { value: "commission_earned", label: "Commission earned" },
  { value: "refund", label: "Refund" },
  { value: "balance_topup", label: "Balance topup" },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

export function TransactionsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") params.set(key, value); else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        defaultValue={searchParams.get("type") ?? "all"}
        onChange={(e) => updateParam("type", e.target.value)}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

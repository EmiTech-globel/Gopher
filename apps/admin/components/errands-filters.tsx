"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "purchased", label: "Purchased" },
  { value: "delivered", label: "Delivered" },
  { value: "confirmed", label: "Confirmed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function ErrandsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Debounced so every keystroke doesn't trigger a server round-trip —
  // 350ms feels responsive without hammering the query on fast typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) params.set("q", query); else params.delete("q");
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleStatusChange(status: string) {
    const params = new URLSearchParams(searchParams);
    if (status && status !== "all") params.set("status", status); else params.delete("status");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by item description..."
          className="w-full rounded-lg border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>
      <select
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

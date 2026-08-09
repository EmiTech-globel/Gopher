import Link from "next/link";
import { Receipt } from "lucide-react";
import type { Database } from "@gopher/shared-types";
import { createClient } from "@/lib/supabase/server";
import { TransactionsFilters } from "@/components/transactions-filters";

type TransactionType = Database["public"]["Enums"]["transaction_type"];

const PAGE_SIZE = 30;

const TYPE_LABELS: Record<TransactionType, string> = {
  payment_in: "Payment in",
  item_cost_payout: "Item cost payout",
  commission_earned: "Commission earned",
  refund: "Refund",
  balance_topup: "Balance topup",
};

interface TransactionRow {
  id: string;
  errand_id: string;
  type: TransactionType;
  amount: number;
  paystack_reference: string | null;
  status: string;
  created_at: string;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; page?: string }>;
}) {
  const { type, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("id, errand_id, type, amount, paystack_reference, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (type) query = query.eq("type", type as TransactionType);
  if (status) query = query.eq("status", status);

  const { data: transactions, count, error } = await query.returns<TransactionRow[]>();

  const errandIds = Array.from(new Set((transactions ?? []).map((t) => t.errand_id)));
  const { data: errands } = errandIds.length
    ? await supabase.from("errands").select("id, item_description").in("id", errandIds)
    : { data: [] as { id: string; item_description: string }[] };
  const errandMap = new Map((errands ?? []).map((e) => [e.id, e.item_description]));

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Transactions</h1>
      <p className="mb-6 text-sm text-muted">Raw ledger for reconciliation. {count ?? 0} total.</p>

      <TransactionsFilters />

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn&apos;t load transactions: {error.message}
        </p>
      )}

      {!error && (transactions ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <Receipt size={28} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No transactions match</p>
        </div>
      )}

      {!error && (transactions ?? []).length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Errand</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Reference</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((txn) => (
                <tr key={txn.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="max-w-48 truncate px-4 py-2.5">
                    <Link href={`/errands?q=${encodeURIComponent(errandMap.get(txn.errand_id) ?? "")}`} className="text-foreground hover:text-brand">
                      {errandMap.get(txn.errand_id) ?? txn.errand_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{TYPE_LABELS[txn.type]}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">₦{Number(txn.amount).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={
                      txn.status === "success" ? "text-status-resolved"
                      : txn.status === "failed" ? "text-status-disputed"
                      : "text-status-pending"
                    }>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{txn.paystack_reference ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(txn.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <PageLink page={page - 1} disabled={page <= 1} type={type} status={status} label="Previous" />
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <PageLink page={page + 1} disabled={page >= totalPages} type={type} status={status} label="Next" />
        </div>
      )}
    </div>
  );
}

function PageLink({
  page, disabled, type, status, label,
}: {
  page: number;
  disabled: boolean;
  type?: string;
  status?: string;
  label: string;
}) {
  if (disabled) {
    return <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground opacity-40">{label}</span>;
  }
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return (
    <Link href={`/transactions?${params.toString()}`} className="rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-surface">
      {label}
    </Link>
  );
}

import Link from "next/link";
import { ListChecks } from "lucide-react";
import type { Database } from "@gopher/shared-types";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { ErrandsFilters } from "@/components/errands-filters";

type ErrandStatus = Database["public"]["Enums"]["errand_status"];

const PAGE_SIZE = 25;

const STATUS_TONE: Record<string, "pending" | "resolved" | "disputed" | "neutral"> = {
  open: "pending",
  accepted: "pending",
  purchased: "pending",
  delivered: "pending",
  confirmed: "resolved",
  disputed: "disputed",
  cancelled: "neutral",
};

interface ErrandRow {
  id: string;
  item_description: string;
  requester_id: string;
  scout_id: string | null;
  status: string;
  item_budget: number;
  delivery_fee: number;
  created_at: string;
}

export default async function ErrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("errands")
    .select("id, item_description, requester_id, scout_id, status, item_budget, delivery_fee, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("item_description", `%${q}%`);
  if (status) query = query.eq("status", status as ErrandStatus);

  const { data: errands, count, error } = await query.returns<ErrandRow[]>();

  const profileIds = Array.from(
    new Set((errands ?? []).flatMap((e) => [e.requester_id, e.scout_id]).filter((id): id is string => !!id))
  );
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Errands</h1>
      <p className="mb-6 text-sm text-muted">Every errand, every status. {count ?? 0} total.</p>

      <ErrandsFilters />

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn&apos;t load errands: {error.message}
        </p>
      )}

      {!error && (errands ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <ListChecks size={28} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No errands match</p>
          <p className="mt-1 text-xs text-muted">Try a different search or filter.</p>
        </div>
      )}

      {!error && (errands ?? []).length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Scout</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Budget</th>
                <th className="px-4 py-2.5 font-medium">Fee</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {(errands ?? []).map((errand) => (
                <tr key={errand.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="max-w-56 truncate px-4 py-2.5 text-foreground">{errand.item_description}</td>
                  <td className="px-4 py-2.5 text-muted">{profileMap.get(errand.requester_id) ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{errand.scout_id ? profileMap.get(errand.scout_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge variant={STATUS_TONE[errand.status] ?? "neutral"}>{errand.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-2.5 text-muted">₦{Number(errand.item_budget).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted">₦{Number(errand.delivery_fee).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(errand.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <PageLink page={page - 1} disabled={page <= 1} q={q} status={status} label="Previous" />
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <PageLink page={page + 1} disabled={page >= totalPages} q={q} status={status} label="Next" />
        </div>
      )}
    </div>
  );
}

function PageLink({
  page, disabled, q, status, label,
}: {
  page: number;
  disabled: boolean;
  q?: string;
  status?: string;
  label: string;
}) {
  if (disabled) {
    return <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground opacity-40">{label}</span>;
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return (
    <Link
      href={`/errands?${params.toString()}`}
      className="rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-surface"
    >
      {label}
    </Link>
  );
}

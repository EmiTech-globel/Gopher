import { Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GenerateBatchesButton } from "@/components/generate-batches-button";
import { SendTransferButton } from "@/components/send-transfer-button";

interface BatchRow {
  id: string;
  scout_id: string;
  week_start: string;
  week_end: string;
  payout_date: string;
  total_amount: number;
  status: "pending" | "paid";
  paystack_transfer_reference: string | null;
}

export default async function PayoutsPage() {
  const supabase = await createClient();

  const { data: batches, error } = await supabase
    .from("payout_batches")
    .select("id, scout_id, week_start, week_end, payout_date, total_amount, status, paystack_transfer_reference")
    .order("payout_date", { ascending: false })
    .limit(100)
    .returns<BatchRow[]>();

  const scoutIds = Array.from(new Set((batches ?? []).map((b) => b.scout_id)));
  const [{ data: profiles }, { data: scouts }] = await Promise.all([
    scoutIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", scoutIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    scoutIds.length
      ? supabase.from("scouts").select("profile_id, paystack_recipient_code").in("profile_id", scoutIds)
      : Promise.resolve({ data: [] as { profile_id: string; paystack_recipient_code: string | null }[] }),
  ]);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const recipientMap = new Map((scouts ?? []).map((s) => [s.profile_id, s.paystack_recipient_code]));

  const pending = (batches ?? []).filter((b) => b.status === "pending");
  const paid = (batches ?? []).filter((b) => b.status === "paid");
  const pendingTotal = pending.reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold text-foreground">Payouts</h1>
          <p className="text-sm text-muted">
            {pending.length} pending batch{pending.length === 1 ? "" : "es"} · ₦{pendingTotal.toLocaleString()} total
          </p>
        </div>
        <GenerateBatchesButton />
      </div>

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn't load payouts: {error.message}
        </p>
      )}

      {!error && (batches ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <Banknote size={28} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No batches yet</p>
          <p className="mt-1 text-xs text-muted">
            Batches generate automatically every Friday, or trigger one manually above.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
          <p className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">Pending</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Scout</th>
                <th className="px-4 py-2.5 font-medium">Week</th>
                <th className="px-4 py-2.5 font-medium">Payout date</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((batch) => {
                const hasRecipient = !!recipientMap.get(batch.scout_id);
                return (
                  <tr key={batch.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-foreground">{nameMap.get(batch.scout_id) ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted">
                      {new Date(batch.week_start).toLocaleDateString()} – {new Date(batch.week_end).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{new Date(batch.payout_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">₦{Number(batch.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      {hasRecipient ? (
                        <SendTransferButton batchId={batch.id} />
                      ) : (
                        <span className="text-xs text-status-pending">No bank details on file</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {paid.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
          <p className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">Paid</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Scout</th>
                <th className="px-4 py-2.5 font-medium">Week</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Transfer ref</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((batch) => (
                <tr key={batch.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-foreground">{nameMap.get(batch.scout_id) ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {new Date(batch.week_start).toLocaleDateString()} – {new Date(batch.week_end).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-muted">₦{Number(batch.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{batch.paystack_transfer_reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

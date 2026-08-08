import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { AccountControls } from "@/components/account-controls";

const STATUS_TONE: Record<string, "pending" | "resolved" | "disputed" | "neutral"> = {
  open: "pending", accepted: "pending", purchased: "pending", delivered: "pending",
  confirmed: "resolved", disputed: "disputed", cancelled: "neutral",
};

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: scout }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, department, created_at").eq("id", id).maybeSingle(),
    supabase
      .from("scouts")
      .select("profile_id, matric_number, trust_tier, verification_status, completed_errands_count, rating_avg, banned_at, ban_reason, mercy_period_ends_at")
      .eq("profile_id", id)
      .maybeSingle(),
  ]);

  if (!profile) {
    return (
      <div>
        <Link href="/accounts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={15} strokeWidth={1.75} /> Back to accounts
        </Link>
        <p className="text-sm text-muted">Account not found.</p>
      </div>
    );
  }

  const [{ data: requesterErrands }, { data: scoutErrands }, { data: ratings }] = await Promise.all([
    supabase
      .from("errands")
      .select("id, item_description, status, delivery_fee, created_at")
      .eq("requester_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    scout
      ? supabase
          .from("errands")
          .select("id, item_description, status, delivery_fee, created_at")
          .eq("scout_id", id)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    supabase
      .from("ratings")
      .select("stars, note, created_at, rated_by")
      .eq("rated_user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const raterIds = Array.from(new Set((ratings ?? []).map((r) => r.rated_by)));
  const { data: raters } = raterIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", raterIds)
    : { data: [] as { id: string; full_name: string }[] };
  const raterMap = new Map((raters ?? []).map((r) => [r.id, r.full_name]));

  return (
    <div>
      <Link href="/accounts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} strokeWidth={1.75} /> Back to accounts
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
            <h1 className="text-lg font-semibold text-foreground">{profile.full_name}</h1>
            <p className="text-sm text-muted">{profile.email}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-3">
              <div>Phone<br /><span className="text-foreground">{profile.phone ?? "—"}</span></div>
              <div>Department<br /><span className="text-foreground">{profile.department ?? "—"}</span></div>
              <div>Joined<br /><span className="text-foreground">{new Date(profile.created_at).toLocaleDateString()}</span></div>
              {scout && (
                <>
                  <div>Matric number<br /><span className="text-foreground">{scout.matric_number}</span></div>
                  <div>Verification<br /><span className="text-foreground capitalize">{scout.verification_status}</span></div>
                  <div>Completed errands<br /><span className="text-foreground">{scout.completed_errands_count}</span></div>
                </>
              )}
            </div>

            {scout?.banned_at && (
              <div className="mt-4 rounded-lg border border-status-disputed bg-status-disputed-bg p-3">
                <p className="text-xs font-medium text-status-disputed">
                  Banned {new Date(scout.banned_at).toLocaleDateString()}
                </p>
                {scout.ban_reason && <p className="mt-1 text-xs text-status-disputed">{scout.ban_reason}</p>}
                {scout.mercy_period_ends_at && (
                  <p className="mt-1 text-xs text-status-disputed">
                    Mercy period ends {new Date(scout.mercy_period_ends_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {scout && (ratings ?? []).length > 0 && (
            <div className="mb-4 rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Reputation {scout.rating_avg ? `— ${scout.rating_avg.toFixed(1)} avg` : ""}
              </p>
              <div className="space-y-2">
                {(ratings ?? []).map((rating, i) => (
                  <div key={i} className="flex items-start gap-2 border-b border-border pb-2 text-xs last:border-0">
                    <div className="flex shrink-0 items-center gap-0.5 text-status-pending">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={11} fill={s < rating.stars ? "currentColor" : "none"} strokeWidth={1.5} />
                      ))}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{raterMap.get(rating.rated_by) ?? "Unknown"}</span>
                      {rating.note && <span className="text-muted"> — {rating.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ErrandHistoryTable title="As requester" errands={requesterErrands ?? []} />
          {scout && <ErrandHistoryTable title="As scout" errands={scoutErrands ?? []} />}
        </div>

        <div>
          {scout && (
            <AccountControls
              profileId={id}
              trustTier={scout.trust_tier as "new" | "trusted"}
              isBanned={!!scout.banned_at}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ErrandHistoryTable({
  title, errands,
}: {
  title: string;
  errands: { id: string; item_description: string; status: string; delivery_fee: number; created_at: string }[];
}) {
  if (errands.length === 0) return null;
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
      <p className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">{title}</p>
      <table className="w-full text-left text-sm">
        <tbody>
          {errands.map((errand) => (
            <tr key={errand.id} className="border-b border-border last:border-0">
              <td className="max-w-48 truncate px-4 py-2 text-foreground">{errand.item_description}</td>
              <td className="px-4 py-2">
                <StatusBadge variant={STATUS_TONE[errand.status] ?? "neutral"}>{errand.status}</StatusBadge>
              </td>
              <td className="px-4 py-2 text-muted">₦{Number(errand.delivery_fee).toLocaleString()}</td>
              <td className="px-4 py-2 text-muted-foreground">{new Date(errand.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

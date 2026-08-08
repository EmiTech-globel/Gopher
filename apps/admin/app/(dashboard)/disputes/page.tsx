import { AlertTriangle, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DisputeResolutionPanel } from "@/components/dispute-resolution-panel";

interface DisputeRow {
  id: string;
  errand_id: string;
  opened_by: string;
  reason: string;
  status: "open" | "resolved";
  evidence_photo_urls: string[] | null;
  created_at: string;
}

interface ErrandRow {
  id: string;
  item_description: string;
  requester_id: string;
  scout_id: string | null;
  item_budget: number;
  delivery_fee: number;
  status: string;
  accepted_at: string | null;
  purchased_at: string | null;
  delivered_at: string | null;
}

interface ChatMessage {
  errand_id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export default async function DisputesPage() {
  const supabase = await createClient();

  const { data: disputes, error } = await supabase
    .from("disputes")
    .select("id, errand_id, opened_by, reason, status, evidence_photo_urls, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .returns<DisputeRow[]>();

  const errandIds = (disputes ?? []).map((d) => d.errand_id);

  const [{ data: errands }, { data: messages }] = await Promise.all([
    errandIds.length
      ? supabase
          .from("errands")
          .select("id, item_description, requester_id, scout_id, item_budget, delivery_fee, status, accepted_at, purchased_at, delivered_at")
          .in("id", errandIds)
          .returns<ErrandRow[]>()
      : Promise.resolve({ data: [] as ErrandRow[] }),
    errandIds.length
      ? supabase
          .from("chat_messages")
          .select("errand_id, sender_id, message_text, created_at")
          .in("errand_id", errandIds)
          .order("created_at", { ascending: true })
          .returns<ChatMessage[]>()
      : Promise.resolve({ data: [] as ChatMessage[] }),
  ]);

  const profileIds = Array.from(
    new Set(
      (errands ?? []).flatMap((e) => [e.requester_id, e.scout_id]).filter((id): id is string => !!id)
    )
  );

  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as { id: string; full_name: string }[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const errandMap = new Map((errands ?? []).map((e) => [e.id, e]));
  const messagesByErrand = new Map<string, ChatMessage[]>();
  (messages ?? []).forEach((m) => {
    const list = messagesByErrand.get(m.errand_id) ?? [];
    list.push(m);
    messagesByErrand.set(m.errand_id, list);
  });

  // Signed URLs for evidence photos — dispute-evidence is a private
  // bucket (migration 00028), admin read allowed via is_admin() RLS.
  const disputesWithEvidenceUrls = await Promise.all(
    (disputes ?? []).map(async (dispute) => {
      const urls = await Promise.all(
        (dispute.evidence_photo_urls ?? []).map(async (path) => {
          const { data } = await supabase.storage.from("dispute-evidence").createSignedUrl(path, 3600);
          return data?.signedUrl ?? null;
        })
      );
      return { ...dispute, evidenceUrls: urls.filter((u): u is string => !!u) };
    })
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Disputes</h1>
      <p className="mb-6 text-sm text-muted">
        Open disputes awaiting resolution. Target: reviewed within 24 hours.
      </p>

      {error && (
        <p className="rounded-lg border border-status-disputed bg-status-disputed-bg p-3 text-sm text-status-disputed">
          Couldn&apos;t load disputes: {error.message}
        </p>
      )}

      {!error && disputesWithEvidenceUrls.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised py-16 text-center">
          <AlertTriangle size={28} strokeWidth={1.5} className="mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No open disputes</p>
          <p className="mt-1 text-xs text-muted">Nothing waiting on you right now.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {disputesWithEvidenceUrls.map((dispute) => {
          const errand = errandMap.get(dispute.errand_id);
          const chatLog = messagesByErrand.get(dispute.errand_id) ?? [];
          const openedByName = profileMap.get(dispute.opened_by) ?? "Unknown";
          const requesterName = errand ? profileMap.get(errand.requester_id) ?? "Unknown" : "Unknown";
          const scoutName = errand?.scout_id ? profileMap.get(errand.scout_id) ?? "Unknown" : "—";

          return (
            <div key={dispute.id} className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {errand?.item_description ?? "Errand not found"}
                  </p>
                  <p className="text-xs text-muted">
                    User: {requesterName} · Scout: {scoutName} · Opened by: {openedByName}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(dispute.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-3 rounded-lg bg-surface p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Reason</p>
                <p className="text-sm text-foreground">{dispute.reason}</p>
              </div>

              {errand && (
                <div className="mb-3 grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-4">
                  <div>Item budget<br /><span className="text-foreground">₦{Number(errand.item_budget).toLocaleString()}</span></div>
                  <div>Delivery fee<br /><span className="text-foreground">₦{Number(errand.delivery_fee).toLocaleString()}</span></div>
                  <div>Accepted<br /><span className="text-foreground">{errand.accepted_at ? new Date(errand.accepted_at).toLocaleString() : "—"}</span></div>
                  <div>Delivered<br /><span className="text-foreground">{errand.delivered_at ? new Date(errand.delivered_at).toLocaleString() : "—"}</span></div>
                </div>
              )}

              {dispute.evidenceUrls.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Evidence photos</p>
                  <div className="flex gap-2">
                    {dispute.evidenceUrls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="Dispute evidence" className="h-20 w-20 rounded-lg border border-border object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <details className="mb-1">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MessageSquare size={13} strokeWidth={1.75} />
                  Chat log ({chatLog.length} message{chatLog.length === 1 ? "" : "s"})
                </summary>
                <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-surface p-3">
                  {chatLog.length === 0 && <p className="text-xs text-muted-foreground">No messages.</p>}
                  {chatLog.map((message, i) => (
                    <p key={i} className="text-xs text-foreground">
                      <span className="font-medium">{profileMap.get(message.sender_id) ?? "Unknown"}:</span>{" "}
                      {message.message_text}
                      <span className="ml-1.5 text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </p>
                  ))}
                </div>
              </details>

              {errand && <DisputeResolutionPanel disputeId={dispute.id} errandId={errand.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

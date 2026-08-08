"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function VerificationActions({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleApprove() {
    setErrorMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("scouts")
      .update({ verification_status: "approved" })
      .eq("profile_id", profileId);
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  async function handleReject() {
    if (!reason.trim()) {
      setErrorMessage("Enter a reason — the applicant will see this.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    const supabase = createClient();

    // resubmission_count tracks how many times this applicant has
    // resubmitted after a rejection (spec Section 4: 3-attempt limit
    // before the app replaces "Resubmit" with "Contact Admin"). We
    // increment it here, at reject time, rather than at resubmit time,
    // since each rejection is what consumes an attempt.
    const { data: current } = await supabase
      .from("scouts")
      .select("resubmission_count")
      .eq("profile_id", profileId)
      .single();

    const { error } = await supabase
      .from("scouts")
      .update({
        verification_status: "rejected",
        rejection_reason: reason.trim(),
        resubmission_count: (current?.resubmission_count ?? 0) + 1,
      })
      .eq("profile_id", profileId);

    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  if (rejecting) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-surface p-3">
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection — shown to the applicant"
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-brand"
        />
        {errorMessage && <p className="mt-1.5 text-xs text-status-disputed">{errorMessage}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleReject}
            disabled={loading}
            className="rounded-md bg-status-disputed px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Confirm rejection"}
          </button>
          <button
            onClick={() => { setRejecting(false); setReason(""); setErrorMessage(null); }}
            disabled={loading}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-status-resolved px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Check size={14} strokeWidth={2} />
          Approve
        </button>
        <button
          onClick={() => setRejecting(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
        >
          <X size={14} strokeWidth={2} />
          Reject
        </button>
      </div>
      {errorMessage && <p className="mt-1.5 text-xs text-status-disputed">{errorMessage}</p>}
    </div>
  );
}

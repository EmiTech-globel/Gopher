"use client";

import { useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { revokeAccountAccess, restoreAccountAccess } from "@/app/(dashboard)/accounts/actions";

export function AccountAccessControls({
  profileId, isRevoked,
}: {
  profileId: string;
  isRevoked: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");

  async function handleRevoke() {
    if (!reason.trim()) {
      setErrorMessage("A reason is required.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const result = await revokeAccountAccess(profileId, reason.trim());
    setLoading(false);
    if (result.error) { setErrorMessage(result.error); return; }
    setShowForm(false);
    setReason("");
  }

  async function handleRestore() {
    setLoading(true);
    setErrorMessage(null);
    const result = await restoreAccountAccess(profileId);
    setLoading(false);
    if (result.error) setErrorMessage(result.error);
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-foreground">Account access</p>
      <p className="mb-3 text-xs text-muted">
        Revokes sign-in access entirely — blocks new sign-ins immediately. All records and
        photos stay on file (spec requires this for scout re-registration prevention);
        nothing is deleted from the database.
      </p>

      {isRevoked ? (
        <button
          onClick={handleRestore}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-status-resolved px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <ShieldCheck size={14} strokeWidth={1.75} />
          {loading ? "Restoring..." : "Restore access"}
        </button>
      ) : showForm ? (
        <div>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for revoking access"
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-brand"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleRevoke}
              disabled={loading}
              className="rounded-md bg-status-disputed px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Revoking..." : "Confirm revoke access"}
            </button>
            <button
              onClick={() => { setShowForm(false); setReason(""); setErrorMessage(null); }}
              disabled={loading}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-status-disputed px-3 py-1.5 text-xs font-medium text-status-disputed transition-colors hover:bg-status-disputed-bg disabled:opacity-50"
        >
          <ShieldOff size={14} strokeWidth={1.75} />
          Revoke access (delete account)
        </button>
      )}

      {errorMessage && <p className="mt-3 text-xs text-status-disputed">{errorMessage}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { adjustTrustTier, banScout, unbanScout } from "@/app/(dashboard)/accounts/actions";

export function AccountControls({
  profileId, trustTier, isBanned,
}: {
  profileId: string;
  trustTier: "new" | "trusted";
  isBanned: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBanForm, setShowBanForm] = useState(false);
  const [banReason, setBanReason] = useState("");

  async function handleTrustTierChange(tier: "new" | "trusted") {
    setLoading(true);
    setErrorMessage(null);
    const result = await adjustTrustTier(profileId, tier);
    setLoading(false);
    if (result.error) setErrorMessage(result.error);
  }

  async function handleBan() {
    if (!banReason.trim()) {
      setErrorMessage("A ban reason is required.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const result = await banScout(profileId, banReason.trim());
    setLoading(false);
    if (result.error) { setErrorMessage(result.error); return; }
    setShowBanForm(false);
    setBanReason("");
  }

  async function handleUnban() {
    setLoading(true);
    setErrorMessage(null);
    const result = await unbanScout(profileId);
    setLoading(false);
    if (result.error) setErrorMessage(result.error);
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-foreground">Admin controls</p>

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Trust tier</p>
        <div className="flex gap-2">
          {(["new", "trusted"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => handleTrustTierChange(tier)}
              disabled={loading}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
                trustTier === tier
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border text-foreground hover:bg-surface"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Account status</p>
        {isBanned ? (
          <button
            onClick={handleUnban}
            disabled={loading}
            className="rounded-md bg-status-resolved px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Working..." : "Reinstate (lift ban)"}
          </button>
        ) : showBanForm ? (
          <div>
            <textarea
              autoFocus
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban — shared with the account holder"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none focus:border-brand"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleBan}
                disabled={loading}
                className="rounded-md bg-status-disputed px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Banning..." : "Confirm ban"}
              </button>
              <button
                onClick={() => { setShowBanForm(false); setBanReason(""); setErrorMessage(null); }}
                disabled={loading}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowBanForm(true)}
            disabled={loading}
            className="rounded-md border border-status-disputed px-3 py-1.5 text-xs font-medium text-status-disputed transition-colors hover:bg-status-disputed-bg disabled:opacity-50"
          >
            Ban scout
          </button>
        )}
      </div>

      {errorMessage && <p className="mt-3 text-xs text-status-disputed">{errorMessage}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { resolveDispute } from "@/app/(dashboard)/disputes/actions";

const RESOLUTION_OPTIONS = [
  { value: "release_to_scout", label: "Release to scout", tone: "resolved" },
  { value: "refund_to_requester", label: "Refund to user", tone: "disputed" },
  { value: "partial_split", label: "Partial split", tone: "pending" },
  { value: "escalate", label: "Escalate / ban", tone: "disputed" },
] as const;

export function DisputeResolutionPanel({
  disputeId, errandId,
}: {
  disputeId: string;
  errandId: string;
}) {
  const [selected, setSelected] = useState<(typeof RESOLUTION_OPTIONS)[number]["value"] | null>(null);
  const [banScout, setBanScout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    setErrorMessage(null);

    const result = await resolveDispute({
      disputeId,
      errandId,
      resolution: selected,
      banScout: selected === "escalate" ? banScout : false,
    });

    setLoading(false);
    if (result.error) {
      setErrorMessage(result.error);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Resolution</p>
      <div className="flex flex-wrap gap-2">
        {RESOLUTION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === option.value
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-foreground hover:bg-surface"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {selected === "escalate" && (
        <label className="mt-3 flex items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={banScout}
            onChange={(e) => setBanScout(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          Also ban this scout
        </label>
      )}

      {(selected === "refund_to_requester" || selected === "escalate") && (
        <p className="mt-3 text-xs text-muted">
          This triggers a real Paystack refund of the item budget + delivery fee (processing fee
          stays non-refundable). Refunds take 3–10 working days to reach the user.
        </p>
      )}

      {errorMessage && <p className="mt-3 text-xs text-status-disputed">{errorMessage}</p>}

      {selected && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="mt-3 rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm resolution"}
        </button>
      )}
    </div>
  );
}

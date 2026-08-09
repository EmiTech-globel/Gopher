"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { generateBatchesNow } from "@/app/(dashboard)/payouts/actions";

export function GenerateBatchesButton() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErrorMessage(null);
    const result = await generateBatchesNow();
    setLoading(false);
    if (result.error) setErrorMessage(result.error);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
      >
        <RefreshCw size={14} strokeWidth={1.75} className={loading ? "animate-spin" : ""} />
        {loading ? "Generating..." : "Generate this week's batches"}
      </button>
      {errorMessage && <p className="mt-2 text-xs text-status-disputed">{errorMessage}</p>}
    </div>
  );
}

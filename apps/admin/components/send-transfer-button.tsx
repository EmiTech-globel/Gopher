"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { sendBatchTransfer } from "@/app/(dashboard)/payouts/actions";

export function SendTransferButton({ batchId }: { batchId: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErrorMessage(null);
    const result = await sendBatchTransfer(batchId);
    setLoading(false);
    if (result.error) setErrorMessage(result.error);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Send size={13} strokeWidth={1.75} />
        {loading ? "Sending..." : "Send transfer"}
      </button>
      {errorMessage && <p className="mt-1.5 max-w-xs text-xs text-status-disputed">{errorMessage}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { updatePlatformSettings } from "@/app/(dashboard)/settings/actions";

interface SettingsFormProps {
  initial: {
    chargesFeePercent: number;
    newScoutValueCap: number;
    trustTierThreshold: number;
    resubmissionLimit: number;
  };
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSaved(false);

    const result = await updatePlatformSettings(values);
    setLoading(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <Field
        label="Charges Fee percentage"
        hint="Gopher's cut of every delivery fee, never touches item cost. Default: 18%."
        suffix="%"
        value={values.chargesFeePercent}
        onChange={(v) => setValues((c) => ({ ...c, chargesFeePercent: v }))}
        step="0.01"
      />
      <Field
        label="New-scout order value cap"
        hint="Errands above this total (item + delivery fee) are hidden from new-tier scouts."
        prefix="₦"
        value={values.newScoutValueCap}
        onChange={(v) => setValues((c) => ({ ...c, newScoutValueCap: v }))}
        step="50"
      />
      <Field
        label="Trust-tier threshold"
        hint="Completed errands (with no unresolved dispute) needed to auto-upgrade new → trusted."
        value={values.trustTierThreshold}
        onChange={(v) => setValues((c) => ({ ...c, trustTierThreshold: v }))}
        step="1"
      />
      <Field
        label="Verification resubmission limit"
        hint="Max verification resubmission attempts before 'Contact Admin' replaces the resubmit button."
        value={values.resubmissionLimit}
        onChange={(v) => setValues((c) => ({ ...c, resubmissionLimit: v }))}
        step="1"
      />

      {errorMessage && <p className="mb-3 text-sm text-status-disputed">{errorMessage}</p>}
      {saved && <p className="mb-3 text-sm text-status-resolved">Saved.</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label, hint, value, onChange, step, prefix, suffix,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <p className="mb-1.5 text-xs text-muted">{hint}</p>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-sm text-muted">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-40 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        {suffix && <span className="text-sm text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

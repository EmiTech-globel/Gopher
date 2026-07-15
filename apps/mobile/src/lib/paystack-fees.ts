// Nigeria, 2026 rates (Section 6): 1.5% + ₦100, capped at ₦2,000,
// waived entirely under ₦2,500. This is what gets passed through to
// the user at checkout per the "fee is always passed to the user"
// decision — Gopher never absorbs it.
export function calculateProcessingFee(amount: number): number {
  if (amount < 2500) return 0;
  const fee = amount * 0.015 + 100;
  return Math.min(fee, 2000);
}
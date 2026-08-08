import { cn } from "@/lib/utils";

const VARIANTS = {
  pending: "bg-status-pending-bg text-status-pending",
  disputed: "bg-status-disputed-bg text-status-disputed",
  resolved: "bg-status-resolved-bg text-status-resolved",
} as const;

export function StatusBadge({
  variant, children,
}: {
  variant: keyof typeof VARIANTS;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant]
      )}
    >
      {children}
    </span>
  );
}
